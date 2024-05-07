### What is Actionify ?
Actionify automatically extract actionable tasks from a text and creates them in a task manager 

This is for example very useful if you journal, write about challenges, goals and projects, and want to become more action-oriented, capture and track tasks in your todo-list. 


### DEMO
[Demo video](https://www.loom.com/share/5658c1e041164219b44dc91818b8a0f6)

### INSTALL

- Step 0: go to project directory
    ```
    cd actionify
    ```
- Step 1: install Python requirements
    ```
    pip install -r requirements.txt
    ```
- Step 2: create secrets.yaml with your credentials
    ```
    cp config.yaml secrets.yaml
    nano secrets.yaml #update following fields: todoist-api-token, todoist-project-id, open-ai-api-key
    ```

### Usage
- Step 0: got to project directory
    ```
    cd actionify
    ```
- Step 1: start a local FastAPI server: 
    ```
    uvicorn main:app --reload
    ```
- Step 2: in a different ab, open index.html with a web browser
    ```
    open -a "Google Chrome" actionify/frontend/standalone/index.html 
    ```
- Step 3: follow instructions on the page to add a text and generate a list of suggested actionable tasks and create them in todoist


### Task manager integrations
There's only an integration with Todoist so far.

### Using the Obsidian plugin
TODO