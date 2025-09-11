<!-- @format -->

# Social Media Summarisation Dashboard

This is a demo dashboard for visualising social media timelines and generating summaries using large language models (LLMs). The dashboard is built with Vite.js and Dash by Plotly and a Flask backend thatuses the Hugging Face Transformers library for text summarization.

## Install dependencies

### Frontend

To run the frontend, you need to have Node.js (>= 0.40.3) and npm (>= 10.8.2) installed. Check the versions with:

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

To run the backend, you need to have Python (>= 3.7) installed. You can check your Python version with:

```
python --version
```

Install the required Python packages defined in `requirements.txt` by running:

```
pip install -r requirements.txt
```

## Run the demo

Both the frontend and backend can be started with same command:

```
npm run dev
```

If you want to run the backend by itself, you can use:

```
python app.py

```

## Notes

- The data for this demo was downloaded from the EECS servers. It is located in /nlp/datasets/clpsych2025/train
-
