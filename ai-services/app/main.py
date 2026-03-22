from fastapi import FastAPI, File, UploadFile
from fastapi import Depends
from PIL import Image
from torchvision import transforms
from models.model import PotholeCNN
from configs.config import PORT
from auth.api_key import verify_internal_api_key
import io
import torch

app = FastAPI()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = PotholeCNN().to(device)
model.load_state_dict(torch.load("model/pothole_cnn.pth", map_location=device))
model.eval()

transform = transforms.Compose([transforms.Resize((224, 224)),transforms.ToTensor()])
class_names = ['alligator_crack','longitudinal_crack','normal','pothole','transverse_crack']

def calculate_severity(confidence, damage_type):
    score = confidence * 10
    if damage_type == "pothole":
        score += 2
    elif damage_type == "alligator_crack":
        score += 1.5
    elif damage_type == "transverse_crack":
        score += 1
    elif damage_type == "longitudinal_crack":
        score += 0.5
    return min(round(score, 2), 10)

def get_priority(score):
    if score < 3:
        return "Low Priority"
    elif score < 7:
        return "Medium Priority"
    else:
        return "High Priority (Repair Needed)"
    
# Public route (health check)
@app.get("/")
def health():
    return {"status": "AI service running"}

# Protected test route
@app.post("/healthCheck")
def health_check(_: None = Depends(verify_internal_api_key)):
    return {"message": "Authorized access"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...),_: None = Depends(verify_internal_api_key)):

    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)

    damage_type = class_names[predicted.item()]
    confidence = confidence.item()

    severity = calculate_severity(confidence, damage_type)
    priority = get_priority(severity)

    return {
        "damage_type": damage_type,
        "confidence": confidence,
        "severity_score": severity,
        "priority": priority
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="localhost", port=PORT, reload=True)