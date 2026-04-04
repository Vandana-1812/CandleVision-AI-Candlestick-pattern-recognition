from pathlib import Path

import pandas as pd
from PIL import Image
from torch.utils.data import Dataset


class CandlePatternDataset(Dataset):
    def __init__(self, images_dir: Path, labels_csv: Path, transform=None) -> None:
        self.images_dir = Path(images_dir)
        self.labels_csv = Path(labels_csv)
        self.transform = transform

        if not self.images_dir.exists():
            raise FileNotFoundError(f"Images directory not found: {self.images_dir}")
        if not self.labels_csv.exists():
            raise FileNotFoundError(f"Labels CSV not found: {self.labels_csv}")

        # Keep the literal class label "None" as a normal string value.
        self.samples = pd.read_csv(self.labels_csv, keep_default_na=False)
        required_columns = {"filename", "label"}
        if not required_columns.issubset(self.samples.columns):
            raise ValueError(
                f"Labels CSV must contain columns {required_columns}, found {set(self.samples.columns)}"
            )

        self.samples = self.samples.dropna(subset=["filename", "label"]).reset_index(drop=True)
        labels = sorted(self.samples["label"].astype(str).unique().tolist())
        self.class_to_idx = {label: index for index, label in enumerate(labels)}
        self.idx_to_class = {index: label for label, index in self.class_to_idx.items()}

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int):
        row = self.samples.iloc[index]
        image_path = self.images_dir / str(row["filename"])

        if not image_path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")

        image = Image.open(image_path).convert("RGB")
        label = self.class_to_idx[str(row["label"])]

        if self.transform is not None:
            image = self.transform(image)

        return image, label
