<!-- @format -->

# Social Media Summarisation Dashboard

This is a demo dashboard for visualising social media timelines and generating summaries using large language models (LLMs). The dashboard is built with Vite.js and Dash by Plotly and a FastAPI backend that uses the Hugging Face Transformers library for text summarization.

## Install dependencies

### Frontend

1.  The frontend is located in the `frontend` directory. To run the frontend, you need to have Node.js (>= 0.40.3) and npm (>= 10.8.2) installed. Check the versions with:

    ```
    node -v
    npm -v
    ```

    If you don't have them installed, you can download and install them from [Node.js official website](https://nodejs.org/).

2.  Install the required npm packages defined in `package.json` by running:

    ```
    npm install
    ```

### Backend

1.  The backend is located in the `backend` directory. To run the backend, you need to have **Python (>= 3.11)** installed. You can check your Python version with:

    ```
    python --version
    ```

2.  Install the required Python packages defined in `requirements.txt` by running:

    ```
    pip install -r requirements.txt
    ```

3.  Prepare a environment file inside the `backend` directory named `.env`. You can do so by running

    ```
    touch .env
    ```

    and then adding the following content:

    ```
    # huggingface token
    HF_TOKEN=your_huggingface_token_here

    # path to cache LLM models
    CACHE_DIR=/import/nlp-datasets/LLMs/ # (change if you want to use different cache)

    # path to summary json files
    DATA_DIR=../frontend/public/data (change if you want to store data elsewhere)
    ```

## Run the demo

1.  Before starting the demo, you can define which GPU you would like to use by setting the `CUDA_VISIBLE_DEVICES` environment variable. For example, to use GPU 0, run:

    ```
    export CUDA_VISIBLE_DEVICES=0
    ```

    Check which GPUs are available with `nvidia-smi` or `gpustat`. You can also use those commands to monitor your GPU usage while running the demo.

2.  Both the frontend and backend can be started with same command, from inside the `frontend` directory:

    ```
    npm run dev
    ```

    If you want to run the backend by itself, you can run `fastapi dev` from inside the `backend` directory.

3.  You can **access the dashboard** by opening your web browser and navigating to `http://localhost:5173`. The backend API will be running at `http://localhost:8000`. If you run the app on a remote server, use port forwarding to access the dashboard. VSCode has a built-in port forwarding feature that you can use.

4.  You can **shut down** the demo by stopping the frontend and backend processes (Ctrl+C in the terminal). The backend will automatically unload the model from GPU memory when the app is closed. However, if you cancel the process while a summary is running, the model may not be unloaded properly. In this case you can find out the process ID (PID) by running:

    ```
    ss -tulpn | grep 8000
    ```

    or

    ```
    gpustat -p
    ```

    and then kill the process with:

    ```
    kill -9 <PID>
    ```

## Notes

- The data for this demo was downloaded from the EECS servers. It is located in /nlp/datasets/clpsych2025/train
-
