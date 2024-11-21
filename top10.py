import pandas as pd
import re
import json
from collections import Counter

# Function to extract countries from the "Authors with affiliations" column
def extract_countries(affiliations):
    countries = re.findall(r', ([A-Za-z ]+)$', affiliations)
    return countries

# Load the CSV file
input_file = 'data/data_scopus.csv'  # Ensure this file is in the same directory
output_file = 'data/top_countries.json'  # Output JSON file name

# Read the CSV data
data = pd.read_csv(input_file)

# Extract countries
data['Countries'] = data['Authors with affiliations'].apply(
    lambda x: extract_countries(x) if pd.notnull(x) else []
)

# Flatten the list of countries for all rows
all_countries = [country for countries in data['Countries'] for country in countries]

# Count occurrences of each country
country_counts = Counter(all_countries)

# Get the top 10 countries
top_countries = country_counts.most_common(10)

# Convert to a dictionary
top_countries_dict = {country: count for country, count in top_countries}

# Save the top 10 countries to a JSON file
with open(output_file, 'w') as f:
    json.dump(top_countries_dict, f, indent=4)

print(f"Top 10 countries have been saved to '{output_file}'.")
