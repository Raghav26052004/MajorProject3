import pandas as pd
import re
import json

# Function to extract countries from the "Authors with affiliations" column
def extract_countries(affiliations):
    countries = re.findall(r', ([A-Za-z ]+)$', affiliations)
    return countries

# Load the CSV file
input_file = 'data/data_scopus.csv'  # Ensure this file is in the same directory as the script
output_file = 'data/author_network.json'  # Output JSON file name

# Read the CSV data
data = pd.read_csv(input_file)

# Extract countries and map them to authors
data['Countries'] = data['Authors with affiliations'].apply(
    lambda x: extract_countries(x) if pd.notnull(x) else []
)

author_country_map = []

for _, row in data.iterrows():
    if pd.notnull(row['Authors']) and row['Countries']:
        authors = [author.strip() for author in row['Authors'].split(',')]
        countries = row['Countries']
        for author in authors:
            for country in countries:
                author_country_map.append({'Author': author, 'Country': country})

# Create a DataFrame for authors and their countries
author_country_df = pd.DataFrame(author_country_map)

# Creating nodes with unique authors and their countries
nodes = [
    {"id": author, "country": country}
    for author, country in author_country_df.drop_duplicates().values
]

# Creating links based on shared publications
links = []

for _, row in data.iterrows():
    if pd.notnull(row['Authors']):
        authors = [author.strip() for author in row['Authors'].split(',')]
        for i in range(len(authors)):
            for j in range(i + 1, len(authors)):
                links.append({"source": authors[i], "target": authors[j]})

# Remove duplicate links
unique_links = [dict(t) for t in {tuple(link.items()) for link in links}]

# Combine into JSON structure
network_data = {
    "nodes": nodes,
    "links": unique_links
}

# Save to a JSON file
with open(output_file, 'w') as f:
    json.dump(network_data, f, indent=4)

print(f"Author network JSON file has been saved as '{output_file}'.")
