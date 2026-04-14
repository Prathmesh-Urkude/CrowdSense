import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import torch.optim as optim
from model import PotholeCNN

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
transform = transforms.Compose([transforms.Resize((224, 224)),transforms.ToTensor()])

dataset = datasets.ImageFolder("dataset/", transform=transform)
print("Classes:", dataset.classes)
loader = DataLoader(dataset, batch_size=16, shuffle=True)

model = PotholeCNN().to(device)
criterion = torch.nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

for epoch in range(10):

    running_loss = 0.0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()

    print(f"Epoch {epoch+1}, Loss: {running_loss:.3f}")

torch.save(model.state_dict(), "model/pothole_cnn.pth")
print("Model trained & saved")
