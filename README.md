# GeorgeCity
## A social media platform that connects farmers to buyers

https://georgecity.onrender.com
https://georgecity-server.onrender.com

### Getting started
- start the backend service first: https://georgecity-server.onrender.com.
- Render spins down requests on free web services when inactive which could stop the frontend from making calls to the backend

### Running the project locally:
* Clone this repository
  ```git
  git clone "https:github.com/devbinaries/georgecity
  ```
  
* For the backend server:
- Create a python environment
   ```python
    cd georgecity
    python -m venv virtualenv
    ```
- Activate the virtual environment
    *** On Windows ***
    ``` python
    virtualenv\Scripts\activate
    ```
  
    *** On Linux/Mac ***
     ``` python
    src/bin/acitvate
    ```
- Install Dependencies
  ```python
  pip install -r requirements.txt
  ```

- Start the server
  ``` python
  python manage.py runserver
  ```

* For the frontend service:
- Install dependencies
    ``` node
    cd fgoergecity
    npm install
    ```

- Run the dev server
    ``` node
    npm run dev
    ```
