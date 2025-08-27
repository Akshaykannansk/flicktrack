
from fastapi import FastAPI
from pyspark.sql import SparkSession
from pyspark.ml.recommendation import ALS
from pyspark.sql.types import StructType, StructField, IntegerType, FloatType
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

spark = SparkSession.builder \
    .appName("Movie Recommender") \
    .getOrCreate()

# --- This is sample data. Replace with your actual data loading logic ---
schema = StructType([
    StructField("userId", IntegerType(), True),
    StructField("movieId", IntegerType(), True),
    StructField("rating", FloatType(), True)
])
ratings_data = [(1, 1, 4.0), (1, 2, 2.0), (1, 3, 5.0),
                (2, 1, 5.0), (2, 2, 4.0),
                (3, 2, 5.0), (3, 3, 4.0)]
ratings = spark.createDataFrame(ratings_data, schema)
# --- End of sample data ---

als = ALS(maxIter=5, regParam=0.01, userCol="userId", itemCol="movieId", ratingCol="rating",
          coldStartStrategy="drop")
model = als.fit(ratings)

@app.get("/recommendations/{user_id}")
def get_recommendations(user_id: int):
    """
    Returns top 10 movie recommendations for a given user.
    """
    # Create a Spark DataFrame with the user
    user_df = spark.createDataFrame([(user_id,)], ['''userId'''])
    
    # Get recommendations for the user
    user_recommendations = model.recommendForUserSubset(user_df, 10)
    
    # Format the recommendations
    recs = user_recommendations.select("recommendations").collect()
    if not recs:
        return {"user_id": user_id, "recommendations": []}

    movie_ids = [row.movieId for row in recs[0].recommendations]
    return {"user_id": user_id, "recommendations": movie_ids}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
