
import torch
import torch.nn as nn
import pandas as pd
from fastapi import FastAPI
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import os

app = FastAPI()

# --- Global variables for model and encoders ---
model = None
user_encoder = None
movie_encoder = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- PyTorch Model Definition ---
class RecommenderNet(nn.Module):
    def __init__(self, n_users, n_movies, emb_size=32):
        super(RecommenderNet, self).__init__()
        self.user_emb = nn.Embedding(n_users, emb_size)
        self.movie_emb = nn.Embedding(n_movies, emb_size)
        self.fc1 = nn.Linear(emb_size * 2, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 1)
        self.relu = nn.ReLU()

    def forward(self, user, movie):
        user_emb = self.user_emb(user)
        movie_emb = self.movie_emb(movie)
        x = torch.cat([user_emb, movie_emb], dim=1)
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        x = self.fc3(x)
        return x

# --- Training and Data Loading ---
def train_model():
    global model, user_encoder, movie_encoder

    # Load processed data from the shared volume
    data_path = "/app/processed_data/ratings.parquet"
    if not os.path.exists(data_path):
        print("Processed data not found. Please run the data pipeline first.")
        return

    df = pd.read_parquet(data_path)

    # Encode user and movie IDs
    user_encoder = LabelEncoder()
    movie_encoder = LabelEncoder()
    df['userId_encoded'] = user_encoder.fit_transform(df['userId'])
    df['movieId_encoded'] = movie_encoder.fit_transform(df['movieId'])

    n_users = df['userId_encoded'].nunique()
    n_movies = df['movieId_encoded'].nunique()

    # Prepare data for PyTorch
    X = torch.tensor(df[['userId_encoded', 'movieId_encoded']].values, dtype=torch.long)
    y = torch.tensor(df['rating'].values, dtype=torch.float32).unsqueeze(1)

    # Instantiate and train the model
    model = RecommenderNet(n_users, n_movies).to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    for epoch in range(10):  # Train for 10 epochs
        optimizer.zero_grad()
        outputs = model(X[:, 0].to(device), X[:, 1].to(device))
        loss = criterion(outputs, y.to(device))
        loss.backward()
        optimizer.step()
        print(f"Epoch {epoch+1}/10, Loss: {loss.item():.4f}")

# --- FastAPI Endpoints ---
@app.on_event("startup")
def startup_event():
    train_model()

@app.get("/recommendations/{user_id}")
def get_recommendations(user_id: int):
    global model, user_encoder, movie_encoder

    if model is None:
        return {"error": "Model not trained yet."}

    try:
        # Encode the user ID
        user_id_encoded = user_encoder.transform([user_id])[0]
    except ValueError:
        return {"error": "User ID not found."}

    # Get a list of all movie IDs
    all_movie_ids = movie_encoder.classes_
    all_movie_ids_encoded = movie_encoder.transform(all_movie_ids)

    # Create a tensor for the user and all movies
    user_tensor = torch.tensor([user_id_encoded] * len(all_movie_ids_encoded), dtype=torch.long).to(device)
    movie_tensor = torch.tensor(all_movie_ids_encoded, dtype=torch.long).to(device)

    # Predict ratings for all movies
    with torch.no_grad():
        predictions = model(user_tensor, movie_tensor)

    # Get top 10 recommendations
    recommendations = torch.argsort(predictions.squeeze(), descending=True)[:10]
    recommended_movie_ids = movie_encoder.inverse_transform(recommendations.cpu().numpy())

    return {"user_id": user_id, "recommendations": recommended_movie_ids.tolist()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
