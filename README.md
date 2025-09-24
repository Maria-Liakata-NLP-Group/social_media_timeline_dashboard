<!-- @format -->

# Social Media Summarisation Dashboard

This is a demo dashboard for visualising social media timelines and generating summaries using large language models (LLMs). The dashboard is built with Vite.js and Dash by Plotly and a FastAPI backend that uses the Hugging Face Transformers library for text summarization.

## Install dependencies

### Frontend

The frontend is located in the `frontend` directory. To run the frontend, you need to have Node.js (>= 0.40.3) and npm (>= 10.8.2) installed. Check the versions with:

```
node -v
npm -v
```

If you don't have them installed, you can download and install them from [Node.js official website](https://nodejs.org/).

Install the required npm packages defined in `package.json` by running:

```
npm install
```

### Backend

The backend is located in the `backend` directory. To run the backend, you need to have Python (>= 3.7) installed. You can check your Python version with:

```
python --version
```

Install the required Python packages defined in `requirements.txt` by running:

```
pip install -r requirements.txt
```

Prepare a environment file inside the `backend` directory named `.env` with the following content:

```
# huggingface token
HF_TOKEN=your_huggingface_token_here

# path to cache LLM models
CACHE_DIR=/import/nlp-datasets/LLMs/ (change if you want to use different cache)

# path to summary json files
DATA_DIR=../frontend/public/data (change if you want to store data elsewhere)
```

## Run the demo

Both the frontend and backend can be started with same command, from inside the `frontend` directory:

```
npm run dev
```

If you want to run the backend by itself, you can use the following command from inside the `backend` directory:

```
fastapi dev

```

## Notes

- The data for this demo was downloaded from the EECS servers. It is located in /nlp/datasets/clpsych2025/train
-
