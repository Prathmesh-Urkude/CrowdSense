import torch
from torchvision import transforms
from PIL import Image
from model import PotholeCNN
from utils import calculate_severity
import io

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = PotholeCNN().to(device)
model.load_state_dict(torch.load("model/pothole_cnn.pth", map_location=device))
model.eval()

transform = transforms.Compose([transforms.Resize((224, 224)),transforms.ToTensor()])
class_names = ['alligator_crack', 'longitudinal_crack', 'normal', 'pothole', 'transverse_crack']

def predict_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)

    damage_type = class_names[predicted.item()]
    confidence = confidence.item()

    severity = calculate_severity(confidence, damage_type)

    return {
        "status": "success",
        "damage_type": damage_type,
        "severity_score": severity,
        "confidence": confidence
    }
