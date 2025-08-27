
import os
import requests
import zipfile
from pyspark.sql import SparkSession

def download_and_extract_movielens(url, target_dir):
    """
    Downloads and extracts the MovieLens dataset.
    """
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    zip_path = os.path.join(target_dir, "movielens.zip")

    if not os.path.exists(zip_path):
        print(f"Downloading MovieLens dataset from {url}...")
        response = requests.get(url, stream=True)
        with open(zip_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print("Download complete.")

    print("Extracting dataset...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(target_dir)
    print("Extraction complete.")

def main():
    spark = SparkSession.builder \
        .appName("MovieLens ETL") \
        .getOrCreate()

    # --- Configuration ---
    movielens_url = "http://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
    data_dir = "/app/data"
    output_dir = "/app/processed_data"

    # --- ETL Process ---
    download_and_extract_movielens(movielens_url, data_dir)

    # Define the path to the ratings file
    ratings_file = os.path.join(data_dir, "ml-latest-small", "ratings.csv")
    
    # Load the ratings data
    ratings_df = spark.read.csv(ratings_file, header=True, inferSchema=True)
    
    # Perform any necessary transformations (e.g., dropping timestamps)
    ratings_df = ratings_df.drop("timestamp")

    # Save the processed data as Parquet
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    ratings_df.write.parquet(os.path.join(output_dir, "ratings.parquet"), mode="overwrite")

    print("ETL process complete. Data saved to Parquet.")
    spark.stop()

if __name__ == "__main__":
    main()
