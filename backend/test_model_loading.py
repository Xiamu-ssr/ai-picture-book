"""
Test script to verify model loading
"""
import torch

def test_cuda():
    """Test if CUDA is available"""
    print("CUDA available:", torch.cuda.is_available())
    if torch.cuda.is_available():
        print("CUDA device count:", torch.cuda.device_count())
        print("CUDA device name:", torch.cuda.get_device_name(0))
    else:
        print("Running on CPU. Note that model loading will be much slower.")
    
    return torch.cuda.is_available()

def test_model_imports():
    """Test if all required modules can be imported"""
    try:
        import diffusers
        from diffusers import StableDiffusionXLControlNetPipeline, ControlNetModel
        print("✓ Diffusers imported successfully:", diffusers.__version__)
        
        import transformers
        print("✓ Transformers imported successfully:", transformers.__version__)
        
        import fastapi
        print("✓ FastAPI imported successfully:", fastapi.__version__)
        
        return True
    except ImportError as e:
        print("❌ Import error:", e)
        return False

if __name__ == "__main__":
    print("Testing CUDA availability...")
    cuda_available = test_cuda()
    
    print("\nTesting model imports...")
    imports_successful = test_model_imports()
    
    if cuda_available and imports_successful:
        print("\n✅ Environment is ready for model loading.")
    else:
        print("\n⚠️ There might be issues with the environment setup.")
        if not cuda_available:
            print("  - CUDA is not available. Models will run on CPU, which is very slow.")
        if not imports_successful:
            print("  - Some required packages are missing or have issues.") 