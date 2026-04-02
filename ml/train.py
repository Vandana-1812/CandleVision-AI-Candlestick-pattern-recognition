from copy import deepcopy
import os
from pathlib import Path

import torch
from torch import nn, optim
from torch.utils.data import DataLoader, Subset
from torchvision import models, transforms

from dataset import CandlePatternDataset


BASE_DIR = Path(__file__).resolve().parent
IMAGES_DIR = BASE_DIR / "dataset" / "images"
LABELS_CSV = BASE_DIR / "dataset" / "labels_balanced.csv"
MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "candle_model.pth"
IMAGE_SIZE = 224
BATCH_SIZE = 16
EPOCHS = 15
LEARNING_RATE = 1e-4
TRAIN_SPLIT = 0.8
RANDOM_SEED = 42
USE_PRETRAINED_WEIGHTS = os.getenv("USE_PRETRAINED_WEIGHTS", "0").strip() == "1"


def build_train_transforms():
    return transforms.Compose(
        [
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(10),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )


def build_eval_transforms():
    return transforms.Compose(
        [
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )


def load_resnet18(num_classes: int) -> nn.Module:
    use_finetune = USE_PRETRAINED_WEIGHTS
    if use_finetune:
        model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        print("Loaded ResNet18 with ImageNet pretrained weights.")
    else:
        model = models.resnet18(weights=None)
        print("Loaded ResNet18 without pretrained weights.")

    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)

    if use_finetune:
        for parameter in model.parameters():
            parameter.requires_grad = False

        # Fine-tune the last few layers.
        for parameter in model.layer3.parameters():
            parameter.requires_grad = True
        for parameter in model.layer4.parameters():
            parameter.requires_grad = True
        for parameter in model.fc.parameters():
            parameter.requires_grad = True
    else:
        # When pretrained weights are unavailable, train all layers.
        for parameter in model.parameters():
            parameter.requires_grad = True

    return model


def accuracy_from_outputs(outputs: torch.Tensor, labels: torch.Tensor) -> int:
    predictions = outputs.argmax(dim=1)
    return (predictions == labels).sum().item()


def evaluate(model: nn.Module, dataloader: DataLoader, criterion: nn.Module, device: torch.device):
    model.eval()
    total_loss = 0.0
    total_correct = 0
    total_samples = 0

    with torch.no_grad():
        for images, labels in dataloader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)

            batch_size = labels.size(0)
            total_loss += loss.item() * batch_size
            total_correct += accuracy_from_outputs(outputs, labels)
            total_samples += batch_size

    average_loss = total_loss / max(total_samples, 1)
    accuracy = total_correct / max(total_samples, 1)
    return average_loss, accuracy


def train() -> None:
    if not LABELS_CSV.exists():
        raise FileNotFoundError(
            f"Balanced labels file not found: {LABELS_CSV}. Run ml/labeler.py first."
        )

    train_transform = build_train_transforms()
    eval_transform = build_eval_transforms()

    base_dataset = CandlePatternDataset(
        images_dir=IMAGES_DIR,
        labels_csv=LABELS_CSV,
        transform=None,
    )

    if len(base_dataset) < 2:
        raise RuntimeError("Need at least 2 samples to create train/test split.")

    train_size = max(1, int(len(base_dataset) * TRAIN_SPLIT))
    test_size = len(base_dataset) - train_size
    if test_size == 0:
        test_size = 1
        train_size = len(base_dataset) - 1

    generator = torch.Generator().manual_seed(RANDOM_SEED)
    all_indices = torch.randperm(len(base_dataset), generator=generator).tolist()
    train_indices = all_indices[:train_size]
    test_indices = all_indices[train_size:]

    train_dataset = Subset(
        CandlePatternDataset(
            images_dir=IMAGES_DIR,
            labels_csv=LABELS_CSV,
            transform=train_transform,
        ),
        train_indices,
    )
    test_dataset = Subset(
        CandlePatternDataset(
            images_dir=IMAGES_DIR,
            labels_csv=LABELS_CSV,
            transform=eval_transform,
        ),
        test_indices,
    )

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    print(f"Total samples: {len(base_dataset)}")
    print(f"Train samples: {len(train_dataset)}")
    print(f"Validation samples: {len(test_dataset)}")
    print(f"Class mapping: {base_dataset.class_to_idx}")

    model = load_resnet18(num_classes=len(base_dataset.class_to_idx)).to(device)
    label_counts = (
        base_dataset.samples["label"]
        .value_counts()
        .reindex(base_dataset.class_to_idx.keys())
        .astype(float)
    )
    class_weights = len(base_dataset.samples) / (
        len(base_dataset.class_to_idx) * label_counts.values
    )
    class_weights_tensor = torch.tensor(class_weights, dtype=torch.float32, device=device)
    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)
    optimizer = optim.Adam(
        (parameter for parameter in model.parameters() if parameter.requires_grad),
        lr=LEARNING_RATE,
    )

    best_val_accuracy = -1.0
    best_state_dict = None

    for epoch in range(EPOCHS):
        model.train()
        running_loss = 0.0
        running_correct = 0
        total_train_samples = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            batch_size = labels.size(0)
            running_loss += loss.item() * batch_size
            running_correct += accuracy_from_outputs(outputs, labels)
            total_train_samples += batch_size

        train_loss = running_loss / max(total_train_samples, 1)
        train_accuracy = running_correct / max(total_train_samples, 1)
        val_loss, val_accuracy = evaluate(model, test_loader, criterion, device)

        print(
            f"Epoch [{epoch + 1}/{EPOCHS}] "
            f"Train Loss: {train_loss:.4f} "
            f"Train Acc: {train_accuracy:.4f} "
            f"Val Loss: {val_loss:.4f} "
            f"Val Acc: {val_accuracy:.4f}"
        )

        if val_accuracy > best_val_accuracy:
            best_val_accuracy = val_accuracy
            best_state_dict = deepcopy(model.state_dict())

    if best_state_dict is None:
        raise RuntimeError("Training completed without producing a model state.")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "model_state_dict": best_state_dict,
            "class_to_idx": base_dataset.class_to_idx,
            "image_size": IMAGE_SIZE,
        },
        MODEL_PATH,
    )
    print(f"Saved best model to {MODEL_PATH}")
    print(f"Best validation accuracy: {best_val_accuracy:.4f}")


if __name__ == "__main__":
    train()
