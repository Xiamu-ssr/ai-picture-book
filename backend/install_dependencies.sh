#!/bin/bash

# Activate the conda environment
echo "Activating conda environment aipb-py311..."
eval "$(conda shell.bash hook)"
conda activate aipb-py311 || { echo "Failed to activate environment. Make sure it's created first."; exit 1; }

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Dependencies installation complete!" 