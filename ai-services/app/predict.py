import torch
from torchvision import transforms
from PIL import Image
from model import PotholeCNN

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = PotholeCNN().to(device)
model.load_state_dict(torch.load("model/pothole_cnn.pth", map_location=device))
model.eval()

transform = transforms.Compose([transforms.Resize((224, 224)),transforms.ToTensor()])
class_names = ['alligator_crack', 'longitudinal_crack', 'normal', 'pothole', 'transverse_crack']

def predict_image(image_path):
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image)
        _, predicted = torch.max(outputs, 1)

    return class_names[predicted.item()]
