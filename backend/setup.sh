#!/bin/bash

# Create conda environment if it doesn't exist
if ! conda env list | grep -q "^aipb-py311 "; then
    echo "Creating conda environment aipb-py311..."
    conda create -n aipb-py311 python=3.11 -y
else
    echo "Conda environment aipb-py311 already exists."
fi

# Activate the environment
echo "Activating conda environment aipb-py311..."
eval "$(conda shell.bash hook)"
conda activate aipb-py311 || { echo "Failed to activate environment"; exit 1; }

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Setup complete! You can now run the server with:"
echo "conda activate aipb-py311"
echo "python run.py" 