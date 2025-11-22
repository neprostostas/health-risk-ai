# Contents of the HealthRisk.AI project documentation

## 1. Introduction

### 1.1. About the project
### 1.2. Goals and objectives
### 1.3. Documentation structure

## 2. System architecture overview (block 10-ARCHITECTURE_OVERVIEW)

### 2.1. High-level system structure
### 2.2. Data flow: from raw NHANES to risk prediction
### 2.3. User interaction with the system
### 2.4. Logical modules and system pages
### 2.5. The role of the database in the architecture
### 2.6. Architecture for integration with a local AI model (Ollama)
### 2.7. Architecture for report generation
### 2.8. Testing as part of the system architecture
### 2.9. Non-functional aspects of the architecture
### 2.10. Summary

## 3. Data and dataset preparation (blocks 0-DATA, 1-ETL)

### 3.1. Data source: NHANES (National Health and Nutrition Examination Survey)
#### 3.1.1. Description of the NHANES dataset
#### 3.1.2. NHANES components used in the project
#### 3.1.3. Raw data structure

### 3.2. Target project dataset: health_dataset.csv
#### 3.2.1. Main variable groups
#### 3.2.2. Demographic variables
#### 3.2.3. Anthropometry
#### 3.2.4. Blood pressure
#### 3.2.5. Laboratory indicators
#### 3.2.6. Target variables

### 3.3. ETL process: preparing NHANES for health_dataset.csv
#### 3.3.1. Files and folders involved in ETL
#### 3.3.2. Raw data
#### 3.3.3. ETL logic and scripts
#### 3.3.4. ETL configuration
#### 3.3.5. ETL process sequence
##### 3.3.5.1. Loading raw tables
##### 3.3.5.2. Merging tables
##### 3.3.5.3. Selecting the necessary columns
##### 3.3.5.4. Handling missing values
##### 3.3.5.5. Filtering
##### 3.3.5.6. Renaming columns
##### 3.3.5.7. Forming the final dataset
#### 3.3.6. Checking the quality of the prepared data
##### 3.3.6.1. Checks for missing values
##### 3.3.6.2. Checking data types
##### 3.3.6.3. Checking ranges
##### 3.3.6.4. Checking the uniqueness of the SEQN key
#### 3.3.7. The role of ETL in a master's project

## 4. Exploratory data analysis (EDA) (block 2-EDA)

### 4.1. Source data for analysis
### 4.2. EDA scripts and tools
### 4.3. Key visualizations and conclusions
#### 4.3.1. Distributions and descriptive statistics
#### 4.3.2. Relationships between variables
#### 4.3.3. Analysis of target variables
#### 4.3.4. Text summary (summary.txt)
### 4.4. How EDA results influenced the selection of features and models
### 4.5. The role of EDA in the master's project

## 5. ML models of the project (block 3-ML_MODELS)

### 5.1. Model set
#### 5.1.1. Models for predicting diabetes (diabetes_present)
#### 5.1.2. Models for predicting obesity (obesity_present)
#### 5.1.3. Key features

### 5.2. Model training
#### 5.2.1. Training scripts
#### 5.2.2. Training pipeline
##### 5.2.2.1. Data loading
##### 5.2.2.2. Data preparation
##### 5.2.2.3. Preprocessing
##### 5.2.2.4. Model training
##### 5.2.2.5. Metrics calculation
##### 5.2.2.6. Saving artifacts
##### 5.2.2.7. Creating a leaderboard
#### 5.2.3. Selecting the Champion Model

### 5.3. Model calibration
#### 5.3.1. Calibration process
#### 5.3.2. Calibration methods
#### 5.3.3. Calibration artifacts

### 5.4. Inference (prediction) in API
#### 5.4.1. API endpoints
#### 5.4.2. Model loading
#### 5.4.3. Pipeline usage

### 5.5. Interpretation and risk factors
#### 5.5.1. Feature importance calculation
#### 5.5.2. Integration into web interface and PDF

### 5.6. Role of ML models in the project

## 6. Technology stack (block 4-TECH_STACK)

### 6.1. Backend
#### 6.1.1. FastAPI
#### 6.1.2. Uvicorn
#### 6.1.3. Starlette
#### 6.1.4. SQLModel and SQLAlchemy
#### 6.1.5. SQLite
#### 6.1.6. Pydantic
#### 6.1.7. JWT (JSON Web Tokens)
#### 6.1.8. OAuth2PasswordBearer
#### 6.1.9. Bcrypt and Passlib
#### 6.1.10. Pillow (PIL)
#### 6.1.11. Requests
#### 6.1.12. Python-multipart

### 6.2. Frontend
#### 6.2.1. Vanilla JavaScript
#### 6.2.2. Chart.js
#### 6.2.3. jsPDF
#### 6.2.4. xlsx-js-style
#### 6.2.5. Navigo
#### 6.2.6. Lucide
#### 6.2.7. Custom i18n module
#### 6.2.8. CSS

### 6.3. ML and data analysis
#### 6.3.1. Pandas
#### 6.3.2. NumPy
#### 6.3.3. Scikit-learn
#### 6.3.4. XGBoost
#### 6.3.5. Joblib
#### 6.3.6. Matplotlib and Seaborn
#### 6.3.7. PyYAML

### 6.4. Database and Storage
#### 6.4.1. SQLite
#### 6.4.2. SQLModel ORM
#### 6.4.3. Migrations

### 6.5. Infrastructure and Development Tools
#### 6.5.1. Makefile
#### 6.5.2. Pytest
#### 6.5.3. Pytest-asyncio
#### 6.5.4. Pytest-cov
#### 6.5.5. Httpx
#### 6.5.6. Pyright
#### 6.5.7. Typer

### 6.6. AI assistant and Ollama
#### 6.6.1. Ollama
#### 6.6.2. Integration with Ollama

### 6.7. Summary

## 7. Project API (block 5-API)

### 7.1. API Architecture
### 7.2. Main Endpoint Groups
#### 7.2.1. Risk Prediction (/predict, /explain, /metadata)
#### 7.2.2. Authentication (/auth/*)
#### 7.2.3. User management (/users/*)
#### 7.2.4. AI assistant (/assistant/*)
#### 7.2.5. Chats (/api/chats/*)
#### 7.2.6. System endpoints (/health, /system/*)

### 7.3. How the API works with ML models
#### 7.3.1. Model storage
#### 7.3.2. Model loading
#### 7.3.3. Pipeline usage
#### 7.3.4. Transferring data to the model
#### 7.3.5. Returning risk assessment
#### 7.3.6. Determining factor impact

### 7.4. How the API works with the database
#### 7.4.1. Data structure
#### 7.4.2. CRUD operations
#### 7.4.3. Integration with ORM

### 7.5. Authentication
#### 7.5.1. JWT tokens
#### 7.5.2. Password hashing
#### 7.5.3. Secure and insecure routes

### 7.6. Generating PDF/Excel/CSV/JSON on the backend and frontend
#### 7.6.1. The role of the backend
#### 7.6.2. The role of the frontend
#### 7.6.3. Export formats

### 7.7. API integration with the Ollama AI model
#### 7.7.1. Integration architecture
#### 7.7.2. Context formation
#### 7.7.3. Ollama API calls

### 7.8. API Status System
#### 7.8.1. Component Status Check
#### 7.8.2. Status Display

### 7.9. API Response Format
#### 7.9.1. JSON Structures
#### 7.9.2. Data Validation

### 7.10. API and front-end interaction
#### 7.10.1. SPA architecture
#### 7.10.2. Error handling

### 7.11. API security
#### 7.11.1. Endpoint protection
#### 7.11.2. Data validation
#### 7.11.3. Access restrictions

### 7.12. Limitations and future work

## 8. Frontend architecture (block 6-FRONTEND_ARCHITECTURE)

### 8.1. Frontend Overview
### 8.2. Frontend File Structure
#### 8.2.1. index.html
#### 8.2.2. app.js
#### 8.2.3. app.css
#### 8.2.4. i18n.js
#### 8.2.5. Localization (locales/)
#### 8.2.6. Fonts and images

### 8.3. SPA architecture
#### 8.3.1. How SPA works
#### 8.3.2. Sections are displayed/hidden
#### 8.3.3. Routes are synchronized
#### 8.3.4. Key concepts

### 8.4. Routing system (Frontend Routing)
#### 8.4.1. System pages
#### 8.4.2. Public and protected pages
#### 8.4.3. Guards for authentication

### 8.5. State Management
#### 8.5.1. authState
#### 8.5.2. chatState
#### 8.5.3. modelResultsState
#### 8.5.4. diagramState
#### 8.5.5. reportState
#### 8.5.6. apiStatusState

### 8.6. Working with the API
#### 8.6.1. Fetch requests
#### 8.6.2. Error handling
#### 8.6.3. Token management

### 8.7. Generating PDF Reports
#### 8.7.1. Using jsPDF
#### 8.7.2. Embedding Charts
#### 8.7.3. Cyrillic Support

### 8.8. Charts
#### 8.8.1. Using Chart.js
#### 8.8.2. Chart types
#### 8.8.3. Exporting to PDF

### 8.9. AI Assistant (Ollama Frontend UI)
#### 8.9.1. Chat Interface
#### 8.9.2. Integration with API
#### 8.9.3. Status Display

### 8.10. UI/UX Architecture
#### 8.10.1. System of sections and pages
#### 8.10.2. Modal windows
#### 8.10.3. Animations and transitions
#### 8.10.4. Adaptability

### 8.11. Styles
#### 8.11.1. CSS architecture
#### 8.11.2. Dark and light themes
#### 8.11.3. BEM-like methodology

### 8.12. Localization system
#### 8.12.1. JSON translation files
#### 8.12.2. Dynamic text replacement
#### 8.12.3. Language support

### 8.13. Frontend tests (architectural review)
### 8.14. Future improvements

## 9. Backend Architecture (Block 7-BACKEND_ARCHITECTURE)

### 9.1. Backend Overview
### 9.2. Backend File Structure
#### 9.2.1. api.py
#### 9.2.2. routers/
#### 9.2.3. routes_auth.py
#### 9.2.4. schemas.py
#### 9.2.5. models.py
#### 9.2.6. db.py
#### 9.2.7. repositories.py
#### 9.2.8. auth_utils.py
#### 9.2.9. model_registry.py
#### 9.2.10. services/assistant_llm.py
#### 9.2.11. avatar_utils.py
#### 9.2.12. i18n.py

### 9.3. ASGI / FastAPI architecture
#### 9.3.1. Starting the service
#### 9.3.2. ASGI lifecycle
#### 9.3.3. Event loop operation
#### 9.3.4. FastAPI integration with the frontend
#### 9.3.5. Middleware

### 9.4. Routers architecture
#### 9.4.1. auth_router
#### 9.4.2. users_router
#### 9.4.3. assistant_router
#### 9.4.4. chats_router
#### 9.4.5. System endpoints

### 9.5. Authentication system
#### 9.5.1. JWT tokens
#### 9.5.2. Password hashing
#### 9.5.3. Dependency injection
#### 9.5.4. Refresh token mechanism

### 9.6. Backend interaction with ML models
#### 9.6.1. Model storage
#### 9.6.2. Model loading
#### 9.6.3. Input data processing
#### 9.6.4. Performing predictions
#### 9.6.5. Calculating influencing factors

### 9.7. Working with the database
#### 9.7.1. ORM and database structure
#### 9.7.2. CRUD operations
#### 9.7.3. Session management
#### 9.7.4. Error handling

### 9.8. Processing forecast history
#### 9.8.1. Saving forecasts
#### 9.8.2. Retrieving history
#### 9.8.3. Statistics

### 9.9. API statuses (API-Status System)
#### 9.9.1. Checking component status
#### 9.9.2. Status aggregation

### 9.10. Chat API
#### 9.10.1. Creating chats
#### 9.10.2. Message management
#### 9.10.3. Blocking users

### 9.11. AI Assistant API (Ollama)
#### 9.11.1. Integration with Ollama
#### 9.11.2. Context Formation
#### 9.11.3. Response Processing

### 9.12. Error handling
#### 9.12.1. Global error handling
#### 9.12.2. Formatting responses
#### 9.12.3. Status codes

### 9.13. Security
#### 9.13.1. CORS control
#### 9.13.2. JWT security
#### 9.13.3. Password hashing
#### 9.13.4. Data validation

### 9.14. Future improvements

## 10. Database (block 8-DATABASE)

### 10.1. General overview
#### 10.1.1. Database type
#### 10.1.2. Main tasks of the database
#### 10.1.3. The role of the database as a central state storage

### 10.2. Technologies and tools for working with databases
#### 10.2.1. Libraries for working with databases
#### 10.2.2. Basic code for working with databases
#### 10.2.3. Organizing connections to databases
#### 10.2.4. Life cycle of sessions in queries

### 10.3. Physical location of the database
#### 10.3.1. Where the database file is stored
#### 10.3.2. Automatic database creation
#### 10.3.3. Initialization/migration scripts

### 10.4. Main tables and their purpose
#### 10.4.1. User table (user)
#### 10.4.2. Prediction history table (predictionhistory)
#### 10.4.3. Chat table (chat)
#### 10.4.4. Message table (chatmessage)
#### 10.4.5. AI assistant message table (assistantmessage)
#### 10.4.6. Blocked users table (userblock)
#### 10.4.7. Password reset token table (passwordresettoken)

### 10.5. Relationships between tables
#### 10.5.1. User ↔ PredictionHistory
#### 10.5.2. User ↔ AssistantMessage
#### 10.5.3. User ↔ Chat
#### 10.5.4. Chat ↔ ChatMessage
#### 10.5.5. User ↔ UserBlock
#### 10.5.6. Other relationships

### 10.6. Transaction management
#### 10.6.1. How a session is opened for a request
#### 10.6.2. How commit/rollback is organized
#### 10.6.3. Context managers / dependency injection
#### 10.6.4. Data integrity in case of errors

### 10.7. Performance and scalability
#### 10.7.1. Indexes on key fields
#### 10.7.2. Which tables grow the fastest
#### 10.7.3. What will be important for scaling

### 10.8. How different system modules use the database
#### 10.8.1. Authentication module
#### 10.8.2. Forecast module
#### 10.8.3. Chat module
#### 10.8.4. API status module
#### 10.8.5. Blocking module
#### 10.8.6. AI assistant module

### 10.9. Data security
#### 10.9.1. How passwords are stored
#### 10.9.2. No storage of “plain” passwords
#### 10.9.3. Possible anonymization of sensitive medical data
#### 10.9.4. Restriction of access via auth level

### 10.10. Possible areas for improvement of the database schema
#### 10.10.1. Transition to a more powerful DBMS
#### 10.10.2. Separation of logs into a separate table/schema
#### 10.10.3. Adding an audit log
#### 10.10.4. Index optimization
#### 10.10.5. Separation of data warehouse and online schema

## 11. Testing (block 9-TESTING)

### 11.1. General overview
#### 11.1.1. Testing levels
#### 11.1.2. Purpose of tests
#### 11.1.3. Physical location of tests

### 11.2. Test directory structure
#### 11.2.1. Root folder tests/
#### 11.2.2. Subfolder tests/backend/
#### 11.2.3. Subfolder tests/frontend/
#### 11.2.4. Subfolder tests/ml/
#### 11.2.5. Subfolder tests/utils/
#### 11.2.6. File conftest.py

### 11.3. Testing tools and frameworks
#### 11.3.1. Pytest
#### 11.3.2. Pytest-asyncio
#### 11.3.3. Pytest-cov
#### 11.3.4. Httpx
#### 11.3.5. Frontend testing tools

### 11.4. Unit tests
#### 11.4.1. Modules covered by unit tests
#### 11.4.2. Location of unit tests
#### 11.4.3. Typical scenarios tested

### 11.5. Integration tests
#### 11.5.1. Components tested by integration tests
#### 11.5.2. Location of integration tests
#### 11.5.3. Organization of environment preparation

### 11.6. Testing ML models
#### 11.6.1. Location of ML tests
#### 11.6.2. Aspects being tested

### 11.7. Testing APIs
#### 11.7.1. Endpoints covered by tests
#### 11.7.2. How tests generate HTTP requests
#### 11.7.3. How tests check status codes
#### 11.7.4. How tests check the structure of JSON responses
#### 11.7.5. How tests check scenarios with errors

### 11.8. Frontend testing
#### 11.8.1. Status of frontend tests
#### 11.8.2. Future tools

### 11.9. Experimental tests and non-standard scenarios
#### 11.9.1. Location of experimental tests
#### 11.9.2. What experimental tests check
#### 11.9.3. How they help confirm system reliability

### 11.10. Running tests and configuration
#### 11.10.1. How to run all tests with a single line
#### 11.10.2. Separate tasks for different types of tests
#### 11.10.3. Using coverage

### 11.11. Coverage and quality
#### 11.11.1. Measuring coverage
#### 11.11.2. Parts of the system with the best test coverage
#### 11.11.3. Parts of the system that are covered less well or not yet covered
#### 11.11.4. How tests integrate with the development process

### 11.12. Possible directions for the development of the testing system

## 12. Project structure (STRUCTURE block)

### 12.1. General directory structure
### 12.2. Key folders and files
#### 12.2.1. artifacts/
#### 12.2.2. configs/
#### 12.2.3. data/
#### 12.2.4. datasets/
#### 12.2.5. scripts/
#### 12.2.6. src/
#### 12.2.7. tests/
#### 12.2.8. docs/

## 13. Limitations and current state of the system

### 13.1. Technical limitations
#### 13.1.1. SQLite limitations
#### 13.1.2. Local Ollama limitations
#### 13.1.3. Frontend limitations
#### 13.1.4. ML model limitations

### 13.2. Functional limitations
#### 13.2.1. Supported target variables
#### 13.2.2. Dataset limitations
#### 13.2.3. Interface limitations

### 13.3. Current development status
#### 13.3.1. Implemented features
#### 13.3.2. Features in development
#### 13.3.3. Known issues

## 14. Future development

### 14.1. ML model expansion
#### 14.1.1. Adding new target variables
#### 14.1.2. Improving existing models
#### 14.1.3. Integrating new algorithms

### 14.2. Architecture improvements
#### 14.2.1. Scaling for production
#### 14.2.2. Microservice architecture
#### 14.2.3. Performance optimization

### 14.3. Functionality expansion
#### 14.3.1. Additional report types
#### 14.3.2. AI assistant improvement
#### 14.3.3. Chat system expansion

### 14.4. Testing improvements
#### 14.4.1. Frontend test coverage
#### 14.4.2. E2E tests
#### 14.4.3. Stress tests

### 14.5. Infrastructure
#### 14.5.1. CI/CD
#### 14.5.2. Monitoring and logging
#### 14.5.3. Backups

## 15. Conclusions

### 15.1. Project summary
### 15.2. Achievements
### 15.3. Contribution to the master's thesis
### 15.4. Prospects for development

# Part 1: Introduction, project overview, data, ETL, and EDA

## 1. Introduction

HealthRisk.AI is a comprehensive system for assessing and predicting health risks based on NHANES (National Health and Nutrition Examination Survey) medical data. The system transforms raw medical data through processing, analysis, and machine learning into an interactive web application that allows users to receive personalized health risk assessments and recommendations.

The system is designed to make advanced machine learning methods in the field of health risk assessment accessible to a wide range of users. The main goal of the project is to provide a tool that allows people to receive objective assessments of the risks of developing diseases such as diabetes and obesity, based on their medical indicators. The system simplifies the complex process of analyzing medical data and turns it into understandable and actionable recommendations.

The high-level logic of the system is organized as a sequential transformation of data from raw medical tables to personalized risk assessments. The process begins with downloading and processing official NHANES data, which contain comprehensive information about the health status of the US population. This data goes through the ETL (Extract, Transform, Load) stage, where it is combined, cleaned and prepared for further analysis. The next stage is exploratory data analysis (EDA), which allows you to understand the distributions of variables, correlations between features and identify key risk factors. The results of EDA are used to train machine learning models that transform medical parameters into risk assessments. The trained models are integrated into the web interface via a REST API, allowing users to enter their indicators and receive instant risk predictions.

The system is intended for people who are interested in assessing their health risks and receiving objective recommendations based on medical indicators. The system is designed for a wide range of users, including those who want to take a proactive approach to maintaining their health, people with risk factors who need regular monitoring, and professionals who can use the system as an auxiliary tool for assessing patient risks.

The system is important because it democratizes access to advanced machine learning methods in medicine, making sophisticated analytical tools accessible to a wide audience. It provides objective risk assessments based on scientifically sound data, allowing users to make informed decisions about their health. The system also serves as an example of the practical application of machine learning in the medical field, demonstrating how large medical datasets can be transformed into useful tools for everyday use.

The main idea of the system is to combine NHANES data analysis, machine learning, REST API and web interface to create a comprehensive solution for health risk assessment. NHANES provides a reliable and representative database for training models, machine learning provides accurate predictions based on complex relationships between health indicators, REST API allows integrating models into a web application, and web interface provides a convenient and understandable way for users to interact with the system. This combination creates a powerful platform that transforms complex medical data into practical and actionable tools for health risk assessment.

## 2. Project Overview

The HealthRisk.AI system consists of several interconnected components that work together to provide full functionality of the platform. Each component has its own specific role and responsibility, but together they create a single integrated system for assessing and predicting health risks.

**Frontend** is the interface layer of the system, implemented as a Single Page Application (SPA) in pure JavaScript. The frontend ensures user interaction with the system via a web browser, providing forms for entering medical parameters, displaying prediction results with risk visualization, integrating chats between users and an AI assistant, generating PDF reports with results, and providing navigation between pages without reloading. The frontend works as a thin client that receives data via API and displays it to users in a convenient and understandable format.

**Backend** is the central interaction layer built on FastAPI that brings together all the components of the system. The backend provides a REST API to the frontend, performs ML inference by loading and using trained models, manages user authentication via JWT tokens, stores and reads data from the database, integrates with Ollama for the AI assistant, and provides system endpoints for monitoring the state of the system. The API acts as an orchestrator that coordinates the work of all the components to handle user requests.

**ML (Machine Learning)** is the intelligent layer of the system that transforms medical parameters into risk assessments. In this stage, multiple machine learning models are trained to predict diabetes and obesity risks. The models are evaluated on metrics, and then the best (champion) model is selected for each task. The champion models are calibrated to improve the quality of the probabilities and stored as artifacts for use in the API.

**Database** is the persistence layer that stores all the dynamic data of the system. The SQLite database contains tables for users, prediction history, chats and messages, AI assistant, and user locks. The DB is the single source of truth for all dynamic data that changes while the system is running.

**API** is an interface between the frontend and backend that enables structured data transfer and query processing. The API provides endpoints for risk forecasting, user management, forecast history, chats, and AI assistant.

**PDF Reports** is a report generation system that transforms forecasting results into structured documents. PDF reports are generated on the frontend via jsPDF and Chart.js, including explanatory text, risk diagrams, top impact factors, and technical details.

**Assistant** is a supporting intelligent layer that provides an AI assistant to explain results and make recommendations. Ollama's local language model runs as a separate service that the backend accesses via an HTTP API to generate responses to user queries.

**Risk Assessment** is the core functionality of the system, allowing users to receive personalized health risk assessments based on their medical indicators. The system assesses the risks of developing diabetes and obesity, providing probabilities, risk categories, and top influencing factors.

The general principles of the system architecture are based on modularity, simplicity, scalability and transparency. **Modularity** is ensured by a clear separation of responsibilities between components, where each module performs specific tasks and interacts with others through clearly defined interfaces. **Simplicity** is achieved through the use of standard technologies and minimalist solutions that ensure ease of understanding, maintenance and expansion of the system. **Scalability** is taken into account through architectural solutions that allow you to easily add new functions and components without affecting existing ones. **Transparency** is ensured through detailed documentation, logging of operations and integration of EDA results into a web interface, which allows users to understand on the basis of which data and analyses forecasts are formed.

The technical stack of the system includes modern tools and libraries to ensure high performance, reliability and ease of development. The backend is built on FastAPI — a modern asynchronous web framework for Python, which provides automatic generation of OpenAPI documentation, data validation via Pydantic and high performance. The frontend is implemented in pure JavaScript without the use of frameworks, which provides minimal dependence on external libraries and full control over the behavior of the application. ML models are trained using scikit-learn, XGBoost and other machine learning libraries. The database uses SQLite for ease of deployment and SQLModel as an ORM for working with data. A detailed description of the technological stack is provided in a separate section of the documentation.

## 3. Data

### 3.1. Data source: NHANES

This project uses the official NHANES (National Health and Nutrition Examination Survey) health dataset, which is available on Kaggle at: https://www.kaggle.com/datasets/cdc/national-health-and-nutrition-examination-survey. NHANES is a representative survey of the health and nutrition status of the US population, conducted by the Centers for Disease Control and Prevention (CDC). The survey includes comprehensive medical measurements, laboratory tests, anthropometric data, and questionnaires covering a wide range of health indicators.

The choice of the NHANES dataset is due to several key factors. First, it is an official data source from the CDC, ensuring high quality and reliability of the information. Second, NHANES is a representative study that covers a large sample of the US population, making the results applicable to a large number of people. Third, the dataset contains comprehensive information on various aspects of health, including demographic data, anthropometric measurements, laboratory parameters, dietary data, and medication intake, which allows for multivariate analysis of health risks. Fourth, NHANES data are widely used in scientific research, which provides the ability to compare results with other works and validate methods.

The NHANES raw data structure is organized as a set of separate tables, each containing a specific category of medical and demographic data. All tables share a unique respondent identifier, the `SEQN` (Sequence Number), which allows data from different sources to be combined for each study participant. This structure allows for flexibility in working with the data, combining only the tables needed for a particular analysis.

This project uses the following NHANES components, which are stored as separate CSV files in the `datasets/raw/` directory:

- **demographic.csv** — demographic data that contains information about the age, gender, race/ethnicity, and other socio-demographic characteristics of respondents. This data is fundamental to any health risk analysis, as demographic factors are closely associated with various diseases.

- **examination.csv** — physical examination data, which includes anthropometric measurements (height, weight, body mass index), blood pressure, and other physical indicators. These data are key to assessing physical health and identifying risk factors.

- **labs.csv** — laboratory indicators containing the results of biochemical blood tests, including glucose levels, cholesterol, and other health markers. These data provide objective information about the body's metabolic state and allow for the detection of early signs of disease.

- **questionnaire.csv** — data from questionnaires that include information about diagnosed conditions (including diabetes status), medical history, and other subjective health indicators. This data complements objective measurements and provides context for interpreting results.

- **diet.csv** — dietary data that contains information about the consumption of various foods and nutrients. Although this data is not used directly in the project models, it may be useful for future extensions of the system.

- **medications.csv** — medication data, which contains information about the medications taken by respondents. This data may also be useful for future analyses and system functionality extensions.

Data types in NHANES cover a wide range of health indicators. **Health indicators** include body mass index, blood pressure, pulse, and other physical characteristics. **Laboratory tests** include biochemical test results, including glucose, cholesterol, hemoglobin, and other markers. **Demographics** include age, sex, race/ethnicity, education, and other sociodemographic characteristics. **Anthropometrics** include height, weight, waist circumference, and other physical measurements. Each data type provides unique information about the respondent's health status and allows for comprehensive risk analysis.

### 3.2. Project target dataset: health_dataset.csv

After processing the raw NHANES data through the ETL process, the target dataset of the project `health_dataset.csv` is formed, which is stored in the `datasets/processed/` directory. This is a merged, cleaned, and prepared dataset that results from the transformation of the raw NHANES tables. It is used for exploratory data analysis (EDA), training machine learning models for risk prediction, and inference (real-world health risk prediction via a web interface and API).

The dataset contains 9770 rows and 10 columns, representing a large sample for analysis and model training. The main groups of variables include demographics, anthropometry, blood pressure, laboratory parameters, disease status, and target variables.

**Demographic variables** are represented by the unique respondent identifier `SEQN`, age in years `RIDAGEYR`, and gender `RIAGENDR` (1 = male, 2 = female). These variables are fundamental to any health risk analysis, as demographic factors are closely associated with various diseases and influence the interpretation of other indicators.

**Anthropometry** is represented by the body mass index `BMXBMI` (Body Mass Index), which is a key indicator for assessing physical health and identifying risk factors associated with obesity.

**Blood pressure** includes systolic blood pressure `BPXSY1` and diastolic blood pressure `BPXDI1`. These values are important markers of cardiovascular health and are associated with the risks of various diseases.

**Laboratory indicators** are represented by blood glucose level `LBXGLU` and total cholesterol `LBXTC`. These indicators provide objective information about the metabolic state of the body and allow for the detection of early signs of diseases, including diabetes and cardiovascular diseases.

**Disease status** is represented by diagnosed diabetes `DIQ010` from the questionnaire, which provides information on the presence of the disease at the time of examination.

**Target variables** are created in the ETL process and include obesity `obesity_present` (1 = yes if BMI ≥ 30; 0 = no) and diabetes `diabetes_present` (1 = yes if DIQ010 == 1; 0 = no). These variables are used to train binary classification models that predict obesity and diabetes risk based on other health indicators.

The data characteristics show that the dataset has sufficient volume for reliable analysis and model training. The data format is CSV with UTF-8 encoding, which ensures compatibility with different tools and platforms. The number of columns is limited to 10 key variables, which simplifies analysis and model training, while preserving all the necessary information for risk prediction.

## 4. ETL process

ETL (Extract, Transform, Load) is the first stage of the master's thesis, where the raw NHANES tables are combined into a consistent, usable dataset. It is at this stage that `health_dataset.csv` is generated, which is then used in exploratory data analysis (EDA) and machine learning (ML) to predict health risks.

The ETL process starts by **downloading the dataset** from the Kaggle platform, where NHANES is available as a set of CSV files. Once downloaded, the files are placed in the `datasets/raw/` directory, where they are stored in their original format for further processing. The ETL scripts read these files with different encodings: first trying UTF-8, and in case of an error, using latin-1 as a fallback encoding, ensuring that the data is read correctly regardless of its origin.

The next step is to **join multiple tables** into one structured table. The join process is performed sequentially: first the first table is joined with the second, then the result with the third, and so on until all six tables are joined. The join is performed on the common key `SEQN` (Sequence Number), which is the unique identifier of each respondent in the NHANES study. An outer join is used, which means that all respondents are retained, even if they are missing data in some tables. This ensures a complete mapping of the different NHANES modules for each respondent and preserves the maximum amount of data for further analysis.

After the tables are merged, **selecting the required columns** from the merged table is performed. The logic is that EDA and ML only need key characteristics, not all hundreds of columns from the original NHANES tables. The main columns that are retained include demographics (SEQN, RIDAGEYR, RIAGENDR), anthropometry (BMXBMI), blood pressure (BPXSY1, BPXDI1), laboratory values (LBXGLU, LBXTC), and disease status (DIQ010). If a column is missing from the merged table, it is simply skipped, but the process continues with the available columns.

**Missing removal** is performed on several levels to ensure data quality. First, duplicates are removed by the key `SEQN`, leaving only the first record for each unique respondent. Next, rows with excessive missing values are filtered: rows in which more than 50% of the numeric columns contain missing values are removed. This means that if a respondent is missing data for more than half of the key indicators, such a record is excluded from the dataset. All numeric columns are converted to float type with error handling, where incorrect values are converted to NaN. Individual missing columns are left for further processing by machine learning models or imputation in subsequent stages.

**Invalid value handling** is performed automatically during data type conversion. Invalid numeric values are converted to NaN, allowing machine learning models to process them through the imputation pipeline. Specific checks for unrealistic measurements (e.g., very high or negative BMI) are not performed during the ETL stage, but can be added during EDA or before training the models.

**Normalization** of the data in the traditional sense (scaling to a range of 0-1 or standardization) is not performed during the ETL stage, as this task is left to the machine learning model pipeline. However, the data structure is normalized: variables retain their original NHANES names (e.g., RIDAGEYR, BMXBMI, BPXSY1), allowing for easy cross-referencing with the original NHANES documentation and providing transparency of the data source.

**The final health_dataset.csv file is generated at the last stage of ETL, when the target variables are created based on business rules. The `obesity_present` variable is created as a binary variable that is equal to 1 if `BMXBMI >= 30` (WHO obesity criterion), otherwise 0. The `diabetes_present` variable is created as a binary variable that is equal to 1 if `DIQ010 == 1` (diagnosed diabetes according to the questionnaire), otherwise 0. Missing values in these variables are filled as 0 (False). After the target variables are generated, the final dataset is saved to the `datasets/processed/health_dataset.csv` file in CSV format with UTF-8 encoding, without row indices.

ETL was necessary because the raw NHANES data is presented as separate tables with different structures and formats, which makes it difficult to use them directly for analysis and training models. The ETL process combines these tables into a single structured table, cleans the data of duplicates and incorrect values, selects relevant variables, and forms target variables for training models. Without this step, it would be impossible to conduct reliable data analysis or train machine learning models.

Why was this pipeline chosen? First, the sequential joining of tables by the key `SEQN` ensures complete data matching for each respondent, preserving the maximum amount of information. Second, the removal of rows with excessive omissions (more than 50%) provides a balance between data preservation and quality: rows with a small number of omissions remain for further processing by the models, and rows with a critical number of omissions are removed as unreliable. Third, the preservation of the original NHANES variable names provides transparency and the ability to reconcile with the original documentation. Fourth, the formation of target variables based on business rules (BMI ≥ 30 for obesity, DIQ010 == 1 for diabetes) provides clear and interpretable target variables for training the models.

## 5. EDA: Exploratory Data Analysis

EDA (Exploratory Data Analysis) was the second stage of the master's thesis after ETL, which checked the quality of the data, analyzed the distributions of variables and the relationships between features. The results of EDA allowed us to formulate hypotheses about risk factors, justify the selection of key features for modeling, and determine approaches to handling missing values. These findings directly influenced the architecture of machine learning models and their performance.

For EDA, the ready-made processed dataset `datasets/processed/health_dataset.csv`, which was created during the ETL stage, is used. The dataset contains 9770 rows and 10 columns, including demographic variables (age, gender), anthropometry (BMI), blood pressure (systolic and diastolic), laboratory parameters (glucose, cholesterol), disease status (diagnosed diabetes), and target variables (presence of obesity, presence of diabetes).

The main logic of EDA is implemented in the `src/analysis/explore_data.py` module, which uses standard Python libraries for data analysis and visualization: pandas for working with dataframes and calculating statistics, matplotlib for creating basic graphs, seaborn for building more complex visualizations (boxplots, heatmaps), and numpy for mathematical calculations and regression lines. The script performs the following main steps: data loading, basic descriptive statistics, missing value analysis, health metric calculation, distribution construction, correlation analysis, and artifact preservation.

**What was analyzed** — EDA included a comprehensive analysis of all key variables in the dataset. The distributions of numerical variables (age, BMI, blood pressure, glucose, cholesterol) were analyzed to understand their nature and identify anomalies. The relationships between variables were investigated through correlation analysis and scatter plots to identify dependencies and potential multicollinearity. The target variables (obesity, diabetes) were analyzed in relation to other indicators to identify key risk factors. Data quality was checked through missing value analysis and outlier detection.

**What metrics were reviewed** — EDA included a wide range of metrics to provide a comprehensive understanding of the data. **Distributions** were analyzed through histograms that showed the shape of the distribution, the presence of bias, and the concentration of values. For BMI, a right-sided bias was observed, indicating the presence of a significant number of people with increased body weight. Most values are concentrated in the range of 20–30, which corresponds to normal and overweight. **Correlations** were analyzed through a correlation matrix and heat map, which showed the relationships between all numerical features. Moderate correlations were found between blood pressure, BMI, and cholesterol, indicating the interrelationship of these indicators. Age is correlated with many health indicators, which confirms the importance of the age factor in risk assessment. Some variables have a weak relationship, which confirms their independence and usefulness for modeling. The **Heatmap** of the correlation matrix is a key visualization for understanding the relationships between variables and avoiding the problem of multicollinearity in modeling.

**How this influenced the selection of features** — The EDA results directly influenced the selection of key features for modeling. Based on the analysis of correlations, distributions, and relationships between variables, the following features were selected to be used in the models for predicting obesity and diabetes: age (RIDAGEYR) — an important feature, since older age is associated with higher risks of both diseases; gender (RIAGENDR) — used to account for gender differences in the distribution of risks; body mass index (BMXBMI) — a key feature for predicting obesity and its associated risks; blood pressure (BPXSY1, BPXDI1) — important indicators that correlate with both target variables; cholesterol (LBXTC) — an indicator that demonstrates a correlation with BMI and general health; glucose (LBXGLU) — a critical feature for predicting diabetes, added to the models if available in the dataset.

Some features were discarded or restricted due to too many missing values (for example, blood pressure has 26.6% missing values, which requires special handling when training the models), duplication of information (some variables may be highly correlated with each other, so the most informative ones are selected to avoid multicollinearity), and weak association with target variables (variables that do not show a significant association with obesity or diabetes are excluded from the models).

**What data features were identified** — EDA identified several important data features that affected further processing and modeling. The largest omissions are observed in blood pressure (about 26.6%) and cholesterol (about 22%), which affects further data processing and requires special imputation methods. The BMI distribution is right-skewed, indicating the presence of a significant number of people with increased body weight. The percentage of people with obesity is 24.02% (2347 people), and the percentage of people with diabetes is 7.54% (737 people), indicating a classification problem with class imbalance. Obese people have a higher average age (45.67 vs 28.72), higher BMI (36.13 vs 22.02), and higher cholesterol (188.34 vs 175.89), which confirms the relationship between these factors. Older age is associated with a significantly higher risk of diabetes, which is an expected outcome from a medical perspective.

**What insights were gained** — EDA provided several key insights that shaped the approach to modeling and interpreting the results. First, age was found to be a critical risk factor for both diseases, justifying its inclusion in all models. Second, BMI is strongly associated with obesity and other risk factors, making it a key feature for modeling. Third, blood pressure and cholesterol show moderate correlations with the target variables, confirming their importance for predicting risks. Fourth, the presence of class imbalance (24% obesity, 7.5% diabetes) requires special handling techniques when training the models, such as weighting the classes or using metrics that account for imbalance. Fifth, the high number of missing values in some variables requires robust imputation methods that do not distort the data distributions.

**Why EDA is an important step before ML** — EDA is a critical step before machine learning because it allows you to understand the nature of the data, identify problems, and make informed decisions about data processing and model selection. Without EDA, it is impossible to properly handle missing values, because it is not known which imputation methods will be most appropriate. Without EDA, it is impossible to select the optimal features for modeling, because it is not known which variables have the greatest impact on the target variables. Without EDA, it is impossible to detect data problems (outliers, anomalies, class imbalances) that can lead to incorrect modeling results. Without EDA, it is impossible to justify the choice of model architecture and data processing methods, which makes the modeling process less transparent and less reliable.

The EDA results (graphs and text report) are stored in the `artifacts/eda/` directory and are used in the explanatory note of the master's thesis, partly in PDF reports, and are also integrated into the project's web interface. The web application's chart page displays key visualizations from the EDA, allowing users to better understand the distributions of health indicators and their relationships. This makes the system more transparent and understandable for end users, who can see on the basis of which data and analyses risk predictions are formed.

# Part 2: ML Models and APIs

## 6. ML Models (Machine Learning)

### 6.1. The purpose of ML in the project

Machine learning in the HealthRisk.AI project acts as the intelligent core of the system, transforming users' medical parameters into objective assessments of health risks. The main goal of the ML component is to provide accurate and reliable predictions of disease risks based on a limited set of medical indicators that the user can easily provide via a web interface.

**What risks are predicted** — The system trains and uses models to predict two key health risks: obesity and diabetes. Obesity is defined as having a body mass index (BMI) of 30 or higher, which meets the criteria of the World Health Organization. Diabetes is defined as having been diagnosed with diabetes according to the NHANES questionnaire. Both risks are binary variables (presence or absence), making the task a two-class classification.

**Why these indicators** — The choice of these two risks is due to several factors. First, both diseases are widespread and have a significant impact on population health, which makes them relevant for assessment. Second, both risks have clear medical criteria for definition, which allows for precise formation of target variables for training models. Third, both risks are associated with factors that can be easily measured or obtained from the user (age, gender, BMI, blood pressure, laboratory parameters), which makes the system practical to use. Fourth, both risks have a sufficient number of positive cases in the NHANES dataset to train reliable models (24% obesity, 7.5% diabetes).

**What variables influence** — The models use the following set of features to predict risks: age of the individual (RIDAGEYR) — an important feature, as older age is associated with higher risks of both diseases; gender (RIAGENDR) — used to account for gender differences in the distribution of risks; body mass index (BMXBMI) — a key feature for predicting obesity and its associated risks; systolic blood pressure (BPXSY1) and diastolic blood pressure (BPXDI1) — important indicators that correlate with both target variables; total cholesterol (LBXTC) — an indicator that demonstrates a correlation with BMI and general health; blood glucose level (LBXGLU) — a critical feature for predicting diabetes, is added to the models if available in the dataset. These features were selected based on the results of EDA, which showed their significance and correlation with the target variables.

### 6.2. Preparing data for models

Preparing data for training models is a critical step that ensures the quality and reliability of predictions. The preparation process includes several key steps, each of which plays a specific role in ensuring that the data is ready for machine learning.

**Normalization** — Data normalization is performed via StandardScaler, which transforms numeric features into a standard distribution with a mean of 0 and a standard deviation of 1. This is critical for models that are sensitive to the scale of the data, such as logistic regression, SVM, and neural networks. Normalization ensures that all features have the same impact on the model regardless of their original value ranges. For example, age (range 0-100) and cholesterol (range 100-300) have the same scale after normalization, allowing the model to correctly assess their importance. Normalization is performed on the training set, after which the normalization parameters (mean and standard deviation) are saved and applied to the test set and new data during inference.

**Train-test split** — the dataset is split into training and test sets in a ratio of 80/20, which provides sufficient data for training and a reliable assessment of the performance of the models. The split is performed with stratification on the target variable, which means that the proportions of positive and negative classes are preserved in both sets. This is critical for unbalanced datasets where positive cases are a minority (7.5% for diabetes, 24% for obesity). Stratification ensures that the model is trained and tested on representative samples, which improves the reliability of the metric estimates. `random_state=42` is used to ensure reproducibility of the results, which allows comparing different models on the same sets.

**Feature Selection** — Feature selection is performed based on EDA results that have shown significance and correlation with the target variables. All models use the same set of features to ensure comparability of results. Features are selected based on several criteria: the presence of a significant relationship with the target variables (detected through correlation analysis and visualizations), accessibility to users (all features can be easily measured or obtained), the absence of excessive correlation between features (to avoid multicollinearity), sufficient amount of available data (features with too many omissions are excluded or specially processed).

**Why these factors** — the choice of these factors is based on medical science and EDA results. Age is a universal risk factor for most diseases, including diabetes and obesity, which is confirmed by numerous studies. Gender accounts for sex differences in the distribution of risks observed in real-world data. BMI is a direct indicator of obesity and is closely associated with metabolic risks, including diabetes. Blood pressure is a marker of cardiovascular health and correlates with both target variables. Cholesterol is an indicator of metabolic status and is associated with the risks of diabetes and cardiovascular disease. Glucose is a direct marker of diabetes and is critical for predicting this risk. EDA results confirmed the significance of these factors through correlation analysis and visualization, which justified their inclusion in the models.

**Imbalance problems** — The dataset has class imbalance, where positive cases are a minority (7.5% for diabetes, 24% for obesity). This poses a problem for models that can learn to always predict the majority class, resulting in high accuracy but low sensitivity to positive cases. Several approaches are used to address this problem: stratification when dividing into training and test samples to ensure representativeness, use of metrics that take imbalance into account (ROC-AUC, Average Precision), weighting classes in some models to increase the importance of positive cases, and calibrating models to improve the quality of probabilities. Class imbalance is taken into account when interpreting results and choosing thresholds for risk categories.

### 6.3. Models used

The project trains and evaluates six different machine learning models for each target variable, allowing for comparison of their performance and selection of the best one. Each model has its own advantages and disadvantages that make it suitable for different use cases.

**Logistic Regression** is a linear classification model that models the probability of a positive class through a logistic function. The model uses a linear combination of features with weights that are trained to minimize a loss function. Logistic regression is one of the simplest and most interpretable models, making it ideal for medical applications where it is important to understand how the model makes decisions.

**What it is used for** — Logistic regression is used as a baseline model for comparison with more complex algorithms and as a primary tool for interpreting results. The model makes it easy to understand the impact of each feature on the prediction through coefficients that show how a change in the feature affects the logarithm of the odds of a positive class.

**Advantages** - Logistic regression has several key advantages: high interpretability - the model coefficients can be easily interpreted as the influence of features on risk, speed of learning and inference - the model learns and predicts very quickly, which is important for real-world use, stability - the model is not prone to overtraining on small datasets, simplicity - the model has no hyperparameters that require tuning, linearity - the model assumes linear relationships between features and the target variable, which is often sufficient for many medical problems.

**Why it became mainstream** — Logistic regression often becomes the mainstream model for medical applications because of its interpretability and reliability. In a project, it may be chosen as the champion model if it shows the best results in terms of ROC-AUC and Average Precision metrics. Even if other models show slightly better results, logistic regression may be chosen because of its simplicity and clarity for users and medical professionals.

**How to interpret the result** — The result of logistic regression is interpreted in terms of the probability of a positive class (0-1), which indicates the risk of developing the disease. The coefficients of the model show the influence of each feature: a positive coefficient means that an increase in the feature increases the risk, a negative one decreases it. The magnitude of the coefficient shows the strength of the influence. For example, if the coefficient for age is 0.05, this means that an increase in age by 1 year increases the logarithm of the odds by 0.05, which corresponds to an approximately 5% increase in risk.

**Random Forest** is an ensemble model that combines the predictions of multiple decision trees to produce a final result. Each tree is trained on a random subset of the data and a random subset of features, which ensures tree diversity and reduces overfitting. The final prediction is calculated as the average or majority vote of all trees.

**Advantages** — Random Forest has several advantages: high accuracy — the model often shows better results than simple algorithms, thanks to the combination of multiple trees, robustness to outliers — the model is less sensitive to outliers than linear models, automatic feature selection — the model can use a large number of features and automatically determine the most important ones, handling of nonlinear relationships — the model can detect complex interactions between features, built-in feature importance assessment — the model automatically calculates the importance of each feature.

**Complexity** — Random Forest is a more complex model than logistic regression, which creates several challenges: lower interpretability — it is difficult to understand how the model makes decisions through the combination of a set of trees, higher tuning complexity — the model has hyperparameters (number of trees, depth of trees, minimum number of samples per leaf) that need to be optimized, higher resource requirements — the model requires more memory and time for training and inference, risk of overtraining — if improperly tuned, the model can overtrain on the training data.

**Why used as a comparison model** — Random Forest is used as a comparison model to assess whether more complex algorithms can improve results compared to simple logistic regression. If Random Forest shows significantly better results, this may justify the use of more complex models. If the difference is small, logistic regression may be chosen due to its simplicity and interpretability.

**Gradient Boosting (XGBoost)** is a powerful ensemble model that sequentially trains weak models (typically decision trees) to correct the errors of previous models. Each new model focuses on cases that previous models predicted incorrectly, allowing for incremental improvements in overall performance.

**Why tested** — XGBoost has been tested as one of the most powerful machine learning algorithms, often showing the best results on various classification tasks. The model has a reputation for high accuracy and the ability to detect complex patterns in data, making it attractive for medical applications where accuracy is critical.

**What results did it show** — XGBoost can show the best results in terms of ROC-AUC and Average Precision metrics among all tested models, which can make it the champion model. However, the model has high complexity and lower interpretability, which can be a trade-off between accuracy and clarity. The results depend on the specific dataset and model settings.

**Other models** — in addition to logistic regression, Random Forest, and XGBoost, the project also tests SVC (Support Vector Classifier), KNN (K-Nearest Neighbors), and MLP (Multi-Layer Perceptron, a neural network). Each of these models has its own characteristics: SVC uses kernels to process nonlinear relationships, KNN is based on nearest neighbor similarity, and MLP uses deep learning to detect complex patterns. All models are evaluated using the same metrics, which allows you to objectively compare their performance and choose the best one.

### 6.4. Layout of models in a project

Machine learning models are organized in the project according to a clear structure that ensures their storage, loading, and use in the API for real-world forecasting.

**ML model files in the repository** — All trained models are stored in the `artifacts/models/` directory, which is organized by target variables and model names. The directory structure is `artifacts/models/{target}/{ModelName}/`, where `target` is the target variable (`diabetes_present` or `obesity_present`) and `ModelName` is the model name (e.g. `LogisticRegression`, `RandomForest`, `XGBoost`). Each model has its own subdirectory that contains the model file, metrics, plots, and other artifacts.

**Where pickle files are stored** — Models are stored in `.joblib` format (joblib library for serializing Python objects), which is an optimized version of pickle for large NumPy arrays. Model files are named `model.joblib` and are stored in a subdirectory of each model. Calibrated versions of champion models are stored separately as `champion_calibrated.joblib` in the target variable directory. Models store a full pipeline that includes a preprocessor (imputation, standardization, encoding) and a trained model, allowing them to be used directly for prediction without additional data preparation.

**How models are loaded into the API** — Models are loaded through a model registry system, implemented in the `model_registry.py` module. On the first request for a prediction, the model is loaded from disk into memory using `joblib.load()`, and then cached in the `_MODEL_CACHE` dictionary for fast access on subsequent requests. The system prefers calibrated models if they are available, otherwise it uses the regular champion model. Caching ensures that the model is loaded only once on first use, which significantly improves API performance.

**Structure of prediction functions** — prediction functions are organized as a pipeline that includes several steps: validating input data via Pydantic schema to check field types, ranges, and mandatory fields; converting input data to pandas DataFrame with columns corresponding to model attributes; passing the DataFrame through the model pipeline, which automatically performs imputation of missing values, standardization of numeric attributes, and encoding of categorical attributes; calculating the probability of a positive class via `pipeline.predict_proba()`; determining the risk category based on the probability (low, medium, high); calculating top impact factors via `calculate_top_factors_simple()`; generating a response in JSON format to return to the client.

### 6.5. Metrics

Model performance is evaluated using a set of metrics, each of which assesses different aspects of forecast quality. Using multiple metrics provides a comprehensive assessment of models and allows you to choose the best one for a specific application.

**Accuracy** is the simplest metric that shows the proportion of correct predictions among all predictions. Accuracy is calculated as the ratio of the number of correct predictions to the total number of predictions. The metric is easy to interpret and understand for a wide audience, but has limitations for unbalanced datasets, where a model can achieve high accuracy by simply always predicting the majority class. For a dataset with 7.5% positive diabetes cases, a model can achieve 92.5% accuracy by simply always predicting the absence of diabetes, which makes the metric uninformative.

**ROC-AUC** is a key metric for binary classification that shows the ability of a model to distinguish between positive and negative classes regardless of the classification threshold. ROC-AUC is calculated as the area under the ROC (Receiver Operating Characteristic) curve, which shows the relationship between sensitivity (True Positive Rate) and specificity (False Positive Rate) at different thresholds. The ROC-AUC value ranges from 0 to 1, where 1 means a perfect model and 0.5 means a model that performs no better than chance. ROC-AUC is the key metric for selecting a champion model because it takes into account class imbalance and evaluates the model’s ability to distinguish between classes at all possible thresholds.

**Precision/Recall** are metrics that evaluate the quality of positive predictions and the ability of the model to detect positive cases. Precision shows the proportion of correct positive predictions among all positive predictions, i.e. how many of the predicted positive cases are actually positive. Recall shows the proportion of detected positive cases among all real positive cases, i.e. how many positive cases the model was able to detect. For medical applications, it is often more important to have a high recall so as not to miss real cases of disease, even if this leads to some false positives.

**Why these metrics** — the choice of these metrics is due to the specifics of the task and the characteristics of the dataset. ROC-AUC is chosen as the main metric because of its ability to evaluate the model regardless of the classification threshold and taking into account class imbalance. Average Precision is chosen as an additional metric for unbalanced classes because it focuses on the quality of positive predictions. Precision and Recall are used for detailed analysis of the quality of predictions and identification of model weaknesses. F1-score is used as a harmonic mean of precision and recall for balanced evaluation. Brier Score is used to evaluate the calibration of probabilities, which is critically important for medical applications, where the accuracy of probabilities affects decision-making.

**Interpretation** — The interpretation of metrics depends on the context of the application. For medical applications, a high ROC-AUC (above 0.8) is considered a good result, as it shows that the model is significantly better than chance. High Precision means that when the model predicts a risk, it is true in most cases, which is important to avoid unnecessary alarms. High Recall means that the model detects most real cases, which is important to avoid missing diseases. The balance between Precision and Recall depends on the specific application: for screening, Recall is more important, for diagnosis, Precision.

**Model Comparison** — Model comparison is performed on multiple metrics simultaneously, allowing you to choose the best model for a specific application. The Champion model is chosen based on the highest ROC-AUC, and in case of equality, the highest Average Precision. The results of all models are stored in `leaderboard.csv`, which contains all the metrics for each model, allowing you to compare their performance and make an informed choice. The comparison also takes into account other factors, such as interpretability, inference speed, and model complexity.

### 6.6. Interpreting Models

Model interpretation is critical for medical applications, where users and professionals need to understand how the model makes decisions and which factors most influence the prediction.

**Feature importance** — The importance of features is calculated through permutation importance, which shows how much the model performance decreases when randomly shuffling the feature values. The method works as follows: the model predicts on a sample of data and calculates a base metric (for example, ROC-AUC); the values of one feature are randomly shuffled, while the others remain unchanged; the model predicts again on the modified data and calculates the metric; the difference between the base and modified metrics shows the importance of the feature. The more the metric decreases when shuffling a feature, the more important this feature is to the model. Permutation importance is calculated for the champion model during training and stored in `champion_importance.json` for use in the API and web interface.

**How Factor Analysis is Done** — Factor analysis is performed at two levels: the global level (for the entire model) and the individual level (for a specific prediction). At the global level, permutation importance is used to determine the overall importance of each feature for the model. This information is used in the `/explain` endpoint to explain the model as a whole. At the individual level, a simplified approach is used that analyzes the normalized feature values for a specific user and calculates their impact on the prediction. This information is used in the `/predict` endpoint to display the top factors that have the greatest impact on a specific user's prediction.

**Why some features are more important** — The importance of features depends on several factors: strength of association with the target variable — features that have a strong association with the target variable have more importance; uniqueness of information — features that provide unique information that cannot be obtained from other features have more importance; variability — features with high variability may have more importance because they allow better discrimination between classes; interactions — some features may have more importance because of interactions with other features, even if they individually have a weak association. For example, BMI may have more importance for predicting obesity because it is a direct indicator of this condition, and age may have more importance for diabetes because of its association with metabolic changes.

**How this affects PDF reports and UI** — Feature importance is integrated into the web interface and PDF reports to provide users with clear information about risk factors. In the web interface, top factors are displayed after each prediction as a list with percentages of influence, allowing users to understand which indicators have the greatest impact on their risk. In PDF reports, top factors are included as a separate section with a detailed description of the influence of each factor, allowing users to save and analyze this information. Feature names are translated into user-friendly terms (e.g. `RIDAGEYR` → "Age", `BMXBMI` → "BMI"), making the information accessible to a wide audience. Impact is shown as a percentage or normalized values, allowing users to easily compare the importance of different factors. Factors are sorted in descending order of influence, allowing users to quickly identify the most important risk factors.

## 7. APIs

### 7.1. API Concept

The HealthRisk.AI API (Application Programming Interface) is the central layer of interaction between the frontend, ML models, database, and health risk prediction system. The API provides structured data transfer, query processing, and returns results in a standardized format.

**FastAPI as a foundation** — The API is built on FastAPI, a modern asynchronous web framework for Python that provides high performance, automatic OpenAPI documentation generation, and built-in data validation via Pydantic. FastAPI is based on Starlette for asynchronous query processing and Pydantic for data validation and serialization, making it an ideal choice for ML applications that require fast query processing and robust input validation.

**Why this framework** — FastAPI was chosen for the project due to several key advantages: high performance — asynchronous request processing provides fast response even under high load; automatic documentation — the OpenAPI schema is generated automatically, which simplifies development and testing; type safety — Pydantic provides automatic validation of types and values, which reduces the number of errors; ease of development — minimal boilerplate code and intuitive syntax simplify the creation of endpoints; integration with ML — easy integration with machine learning libraries and the ability to use synchronous functions for ML operations.

**Request/response model** — The API uses the standard REST model, where the client sends an HTTP request with data in JSON format, and the server processes the request and returns a response also in JSON format. All requests are validated through Pydantic schemas, which check for the presence of required fields, data types, and value ranges before processing. All responses are also structured through Pydantic schemas, which ensures consistency and predictability of the data format.

**JSON format** — all data is transmitted in JSON format, which ensures compatibility with different clients and platforms. JSON is a standard format for REST APIs and is supported by all modern programming languages and frameworks. The JSON structure is defined through Pydantic schemas, which automatically serialize Python objects to JSON and deserialize JSON to Python objects, which simplifies working with data.

**Performance** — The API is optimized for high performance through several mechanisms: model caching — models are loaded once and stored in memory for fast access; asynchronous processing — FastAPI uses asynchronous query processing, which allows multiple queries to be processed simultaneously; database query optimization — using indexes and efficient SQL queries ensures fast data access; minimal processing — data is processed only as needed without unnecessary transformations; local execution — all components (API, DB, ML models) run locally, which reduces network latency.

### 7.2. Main endpoint groups

The API is organized into functional groups of endpoints, each of which performs specific tasks and provides specific system functionality.

**`/predict` — get prediction** — is the main endpoint of the system that accepts patient parameters (age, gender, BMI, blood pressure, glucose, cholesterol) and target variable (diabetes or obesity), loads the appropriate ML model, performs inference and returns the risk probability, risk category (low, moderate, high), top influence factors and model metadata. The endpoint supports optional authentication — if the user is authenticated, the prediction is automatically saved in history for further analysis. The endpoint validates input data via the Pydantic schema, processes missing values via the model pipeline and calculates top influence factors for interpreting the result.

**`/auth/*` — registration, login, tokens** — the group of endpoints for authentication and user management includes `/auth/register` for registering a new user with validation of email, password and required profile fields; `/auth/login` for logging in a user with return of JWT token and profile; `/auth/me` for getting the profile of the currently authenticated user; `/auth/update-profile` for updating the user profile (first name, last name, date of birth, gender, avatar); `/auth/change-password` for changing the password with verification of the current password; `/auth/forgot-password` for initializing the password recovery process via email token; `/auth/reset-password` for setting a new password via recovery token. All endpoints use password hashing via bcrypt for security and data validation via Pydantic schemes.

**`/users/*` — working with users** — endpoints for user management include `/users/history` to get the user's forecast history with filtering and pagination; `/users/history/stats` for forecast history statistics for charting (distribution by goals, risk categories, models, time series); `/users/history/{id}` to remove a specific forecast from history; `/users/history/clear` to clear the entire user's forecast history; `/users/avatar` to upload a user's avatar with format and size validation. All endpoints require authentication and verify that resources belong to the user.

**`/chats/*` — chat and AI assistant** — endpoints for the chat system between users include `/api/chats` to get a list of all user chats with information about the last message and the number of unread ones; `/api/chats/{chat_uuid}` to get detailed information about a specific chat with all messages; `/api/chats` (POST) to create a new chat or get an existing one between two users; `/api/chats/{chat_uuid}/messages` (POST) to send a message to a chat; `/api/chats/{chat_uuid}/read` (POST) to mark all messages in a chat as read; `/api/chats/{chat_uuid}` (DELETE) to delete a chat and all its messages; `/api/chats/{chat_uuid}/pin` (PATCH) to pin or unpin a chat; `/api/chats/reorder` (PATCH) to change the order of chats in the list; `/api/chats/users` to get a list of all active users to create chats; `/api/chats/unread-count` to get the total number of unread messages. All endpoints check for user blocking and resource access.

**`/reports/*` — PDF generation** — The API does not have dedicated endpoints for PDF generation, as PDF is generated on the frontend. However, the API provides data for report generation via the `/users/history` endpoints for forecast history, `/users/history/stats` for statistics for charts, and `/predict` for prediction results. The frontend uses this data to generate PDF reports via jsPDF and Chart.js.

**`/api-status/*` — system statuses** — endpoints for monitoring system health include `/health` to check API health, returns a list of available routes and service version; `/system/database/stats` to get database statistics, including the number of records in each table, database size, and activity over the last 7 days; `/assistant/health` to check Ollama server status with latency measurement. All endpoints do not require authentication and are used to monitor the availability of system components.

**`/history/*` — forecast history** — endpoints for working with forecast history include `/users/history` to get a list of all saved user forecasts with filtering and pagination; `/users/history/stats` for forecast history statistics for charting; `/users/history/{id}` to remove a specific forecast from history; `/users/history/clear` to clear the entire user forecast history. All endpoints require authentication and verify that resources belong to the user.

### 7.3. Token Verification and Authentication

The API authentication system is built on JWT (JSON Web Tokens) and provides secure access to protected resources through a token mechanism.

**JWT** — JSON Web Tokens are a standard for securely transmitting information between parties in JSON format. Tokens contain encoded user information (email, expiration time) and are signed with a private key to ensure integrity. JWT is used to authenticate users without the need to store session state on the server, making the API stateless and scalable.

**Access token** is the main authentication token issued after a successful login or registration. The token contains the user's email and expiration time (default 60 minutes) and is signed with a private key using the HS256 algorithm. The token is passed in the `Authorization` header in the `Bearer <token>` format with each request to the secure endpoints. The API validates the token, decrypts it, and loads the user from the database for further processing of the request.

**Refresh token** — not currently implemented in the project, but can be added to extend the session without re-login. Refresh tokens have a longer validity period (e.g. 7 days) and are stored in the database for revocation. When the access token expires, the client can use the refresh token to obtain a new access token without having to re-login.

**Why this scheme** — the choice of the JWT scheme is due to several factors: stateless — the API does not store session state, which makes it scalable and easy to deploy; security — tokens are signed with a secret key, which ensures their integrity and authenticity; simplicity — tokens are easily transmitted via HTTP headers and do not require complex storage mechanisms; scalability — tokens can be verified on any server without access to the DB, which allows the API to be horizontally scaled.

**How the frontend uses tokens** — The frontend stores a JWT token in LocalStorage under the key `hr_auth_token` after a successful login or registration. The token is automatically added to all API requests in the `Authorization` header in the format `Bearer <token>`. The frontend checks for the token when the page loads and automatically redirects to the login page if the token is missing or invalid. When receiving a 401 (unauthorized) error, the frontend automatically clears the token and redirects the user to the login page.

**How Secure Routes Are Handled on the API** — Secure routes use dependency injection via `Depends(require_current_user)`, which automatically extracts the token from the `Authorization` header, validates it, decrypts it, and loads the user from the database. If the token is invalid or the user is not found, the function throws an HTTPException with status 401, which results in an error being returned to the client. If the token is valid, the user is passed to the endpoint function as a parameter, allowing it to be used to process the request and verify access to resources.

### 7.4. How the API interacts with ML models

The API integrates with ML models through a model registration system that ensures they are loaded, cached, and used for inference.

**How the model is loaded into memory** — Models are loaded via the `load_champion()` and `load_model()` functions in the `model_registry.py` module. On the first request for a prediction, the model is loaded from disk into memory using `joblib.load()`, which deserializes the stored pipeline (preprocessor + model) from the `.joblib` file. Once loaded, the model is stored in the `_MODEL_CACHE` dictionary for quick access on subsequent requests. The system prefers calibrated models (`champion_calibrated.joblib`) if available, otherwise it uses the regular champion model.

**How it is used for each request** — for each prediction request, the API performs the following steps: receives user input via the Pydantic schema `PredictRequest`; validates data (types, ranges, mandatory fields); loads the model via `load_champion()` or `load_model()` (from cache, if already loaded); converts input to a pandas DataFrame with columns corresponding to the model features; passes the DataFrame through the model pipeline, which automatically performs imputation of missing values, standardization of numeric features, and encoding of categorical features; calculates the probability of a positive class via `pipeline.predict_proba()`; determines the risk category based on the probability; calculates the top influence factors; generates a response in JSON format and returns it to the client.

**Why not load on every request** — Loading the model on every request would be inefficient for several reasons: load time — loading the model from disk takes several seconds, making the API slow and unusable for real-world use; memory usage — reloading the model causes data duplication in memory, which increases resource usage; disk load — frequent disk reads create additional load on the system and reduce performance; instability — loading the model on every request can lead to instability due to possible disk read errors. Caching models in memory provides fast access (milliseconds instead of seconds) and API stability.

**Working with FeatureImpact** — the calculation of top influence factors is performed through the `calculate_top_factors_simple()` function, which analyzes the normalized feature values for a specific user and calculates their impact on the prediction. The function uses the normalized absolute feature values as a proxy for influence, since calculating the exact influence for complex models (e.g., Random Forest, XGBoost) requires significantly more computation. Factors are ranked by absolute influence value and returned as the top 5 most important. For a detailed explanation of the model, the `/explain` endpoint is used, which calculates the permutation importance on a sample from the dataset for a global explanation of the model.

**JSON response return algorithm** — JSON response generation is performed automatically via Pydantic schema `PredictResponse`, which serializes data into JSON format. The response includes the fields `target` (target variable), `probability` (probability from 0 to 1), `risk_bucket` (risk category: low, medium, high), `model_name` (model name), `version` (model version), `is_calibrated` (whether a calibrated model is used), `top_factors` (list of factors with `feature` and `impact` fields), `note` (note about the calculation method). The probability is limited to the range (0.0001, 0.9999) to protect against extreme values and stability of risk categories. If the user is authenticated, the result is also saved in the prediction history via `save_history_entry()`.

### 7.5. Error Handling

Error handling in the API ensures system reliability and provides users with clear messages about problems.

**Input Validation** — All input data is validated against Pydantic schemas that check for required fields, data types, value ranges, and formats. In case of validation errors, Pydantic automatically generates detailed error messages that include information about the field, the error type, and the expected value. Validation is performed automatically upon request, ensuring that only valid data is passed for processing.

**Handling 400, 401, 422** — The API uses standard HTTP status codes to indicate different types of errors: 400 (Bad Request) — invalid request, for example, missing required fields or incorrect data types; 401 (Unauthorized) — unauthorized access, for example, missing or invalid JWT token; 422 (Unprocessable Entity) — data validation error, for example, value out of range or incorrect format. All errors are returned in JSON format with a `detail` field, which contains a detailed description of the error for easy processing on the frontend.

**Field validation** — field validation is performed at several levels: Pydantic level — automatic validation of field types, ranges, and mandatory fields through Pydantic schemas; business logic level — additional validation of specific rules, for example, checking the uniqueness of an email during registration or checking that resources belong to a user; DB level — checking DB constraints, for example, the uniqueness of keys or foreign key constraints. Multi-level validation ensures system reliability and prevents processing of incorrect data.

**Standardized errors** — All errors are returned in a standardized JSON format with `detail` fields (detailed error description) and optional fields for additional information. The error format is consistent across the API, which simplifies front-end processing and ensures predictable behavior. Errors are also logged on the server for troubleshooting and monitoring.

**Validation via Pydantic** — Pydantic provides automatic data validation by defining schemas that describe the expected structure and types of data. Schemas automatically check types (int, float, str, bool), value ranges (e.g. age 0-120, BMI 10-60), required vs optional fields, formats (e.g. email, UUID), and value validity (e.g. enum values). In case of validation errors, Pydantic automatically generates detailed error messages that include information about the field, the error type, and the expected value, making it easier to diagnose problems on the client side.

### 7.6. PDF reports

The generation of PDF reports in the project is implemented mainly on the frontend, and the API provides the transfer of the necessary data in JSON format.

**How the API interacts/does not interact with PDF** — The API does not generate PDF directly, but provides data via standard endpoints in JSON format. The API does not have dedicated endpoints for generating PDFs, as all formatting and rendering logic is on the client. The API ensures data consistency via Pydantic schemas, but does not define the report format, which gives the frontend flexibility in choosing how to display the data.

**Why PDF on the frontend** — PDF generation on the frontend has several advantages: reduced server load — PDF generation is performed on the client, which reduces the load on the server and allows you to process more requests; speed — PDF generation on the client provides a fast response without having to wait for processing on the server; flexibility — the frontend can easily change the report format without changes on the server; scalability — PDF generation on the client does not limit the number of simultaneous requests for report generation. The disadvantage is the dependence on browser capabilities and the need to download additional libraries on the client.

**How data is transmitted** — Data for PDF generation is transmitted through standard API endpoints in JSON format. The frontend makes requests to `/users/history` to get the history of predictions, `/users/history/stats` for statistics for charts, and `/predict` for prediction results. All responses are returned in JSON format with structured data, which allows the frontend to easily process them for report generation. The API does not perform server-side rendering — all formatting and visualization logic is on the client.

### 7.7. API for AI assistant

The API integrates with a local Ollama server to implement an AI health assistant that provides personalized recommendations to users.

**Ollama Calls** — The API makes HTTP POST requests to the local Ollama server (`http://localhost:11434/api/generate`) using the `requests` library. Requests include a model (by default `llama3`), a prompt with instructions and context, generation parameters (temperature, max_tokens), and optional parameters to control the behavior of the model. The API does not support streaming — all requests are executed synchronously upon receipt of the full response, which simplifies processing, but may cause delays for long responses.

**Context Processing** — The context about the user's health status is formed based on the latest prediction via the `build_health_context()` function, which includes information about the target variable (diabetes or obesity), risk probability, risk category (low, medium, high), top influence factors, and user input parameters. The context is formed in Ukrainian or English depending on the `language` parameter in the query. The context is added to the system prompt, which contains instructions for the assistant (do not make diagnoses, do not prescribe treatment, provide general recommendations) and ensures that the assistant provides useful and safe answers.

**Message history logic** — message history is stored in the database in the `assistantmessage` table with the fields `user_id`, `role` (user or assistant), `content` (message text), `prediction_id` (optional prediction link), `created_at` (timestamp). When a user sends a message, it is stored in the database, after which the context is formed, Ollama is called, the assistant's response is stored in the database and returned to the user. Message history can be retrieved via the `/assistant/history` endpoint for display on the frontend and use in subsequent dialogs to provide context for the conversation.

# Part 3: Frontend and UI/UX

## 8. Frontend (Web Interface)

### 8.1. General overview

The frontend of the HealthRisk.AI project is the central interface for user interaction with the health risk prediction system. It is implemented as a Single Page Application (SPA) in pure JavaScript without the use of frameworks, providing a minimalist, standalone and lightweight client with full functionality of the system.

**What is frontend in a project** — the frontend is the client part of a web application, which is responsible for displaying the user interface, handling interactions, communicating with the API, and generating reports. It runs entirely in the user's browser and does not require server-side rendering, which makes it fast and scalable. The frontend integrates with all system components: API for retrieving data and performing operations, ML models via API for risk prediction, database via API for storing history and profiles, Ollama via API for AI assistant.

**What technologies are used** — the frontend is built on native web technologies: HTML5 for page structure, CSS3 for styling and animations, Vanilla JavaScript (ES6+) for logic and interactivity. Additionally, external libraries are used: Chart.js for building charts, jsPDF for generating PDF reports, xlsx-js-style for exporting to Excel, Navigo for routing, Lucide for icons. All libraries are loaded from a CDN, which simplifies deployment and updates. Native modules (i18n.js for localization, app.js for the main logic) are loaded from the server and integrated with HTML.

**Why vanilla JS + HTML/CSS without frameworks** — the choice of native technologies without frameworks is due to several factors: ease of development — no need to configure the build system (Webpack, Vite) simplifies development and testing; ease of maintenance — code without framework abstractions is easier to understand and modify; loading speed — the absence of large framework libraries reduces the size of downloaded files and speeds up the first page load; full control — the developer has full control over the behavior of the application without framework restrictions; minimal dependencies — fewer dependencies reduce the risk of version conflicts and compatibility issues; educational goal — for a master's project, it is important to demonstrate understanding of the basics of web development without relying on ready-made solutions.

**SPA Architecture** — Single Page Application works through a single HTML file that contains all the page sections in a hidden state. When a page is loaded, the backend always returns the same HTML file regardless of the URL, and JavaScript determines which section to display based on the current URL. All sections are present in the DOM from the beginning, but are hidden via CSS classes and the `hidden` attribute, which allows you to quickly switch between pages without additional HTTP requests. Switching sections is done by adding the `page--active` class and removing the `hidden` attribute for the active section and hiding all others.

**Route interception without reloading** — navigation between pages is performed without reloading the page via the browser's History API. When a link is clicked or a programmatic route change is made, JavaScript intercepts the event, updates the URL via `history.pushState()` or `history.replaceState()`, activates the corresponding section, and updates the interface. When using the browser's "Back" and "Forward" buttons, the `popstate` event handler is triggered, which synchronizes the SPA state with the URL. This provides smooth navigation without reload delays and preserves the browsing history for the user.

### 8.2. Frontend structure

The frontend is organized in the `src/service/web/` directory with a clear separation of responsibilities between files and modules.

**index.html** is the root HTML file that contains the structure of the entire page. It includes all page sections (prediction form, history, charts, profile, chats, assistant, API status, etc.) in a hidden state, a sidebar with navigation, modal windows, loading overlays, and other UI components. The HTML contains all the necessary elements for the SPA to work, including attributes for localization (`data-i18n`), Lucide icons (`data-lucide`), and structured data for access via JavaScript. All libraries are loaded via `<script>` tags in `<head>`, and custom modules are loaded with the `defer` attribute to ensure the correct initialization order.

**app.js (huge orchestrator)** is the main SPA logic file that contains all the business logic of the frontend. The file has approximately 14667 lines of code and includes: state management (authState for authentication, predictionStore for prediction results, diagramState for diagrams, chatState for chats, apiStatusState for monitoring); routing system (ROUTE_SECTIONS for mapping URLs to sections, normalizePath for normalizing paths, showSectionForPath for activating sections, syncRouteFromLocation for synchronizing with URLs); working with APIs (apiFetch for HTTP requests, response processing, data validation, error handling); generating PDF reports (generatePDFReport, chart export, text formatting, Cyrillic support); working with Chart.js charts (creation, update, export); integration with AI assistant (sending messages, displaying responses, saving history); processing forms (validation, sending, displaying results); all user interactivity (clicks, keystrokes, changing themes, switching sidebars).

**app.css** is the global styles for the entire application that define the appearance of all components, themes (light/dark), animations, responsiveness, and typography. CSS is organized using a BEM-like methodology using modifiers and nested selectors. Styles include CSS variables for themes (colors, gradients, shadows, transparency), browser style normalization, component styles (sidebar, forms, charts, modals, tooltips), page section styles, animations and transitions, responsive styles via media queries, and utility classes for spinners, badges, and other elements.

**Component folders** — although the frontend does not use the component architecture of frameworks, the logic is organized functionally through functions in `app.js` that are responsible for specific components. Components include forms (forecast form, login form, registration form, profile form), charts (Chart.js instances for different chart types), modal windows (action confirmation, settings, information), notifications (toast notifications for successes, errors, information), sidebar (navigation, topic switching, statuses), chats (chat list, chat detail view, messages), AI assistant (chat interface, message history).

**Page folders (page-*)** — all pages are implemented as sections in HTML with unique IDs that correspond to the `page-` prefix. Sections include `page-form` for the forecasting form, `page-history` for the forecast history, `page-insights` for charts and analytics, `page-profile` for the user profile, `page-assistant` for the AI assistant, `page-chats` for the chat system, `page-report` for reports, `page-api-status` for system monitoring, `page-login` for login, `page-register` for registration, `page-about` for system information. Each section contains its own HTML structure, which is activated via JavaScript during navigation.

**Charts folder** — charts are implemented via Chart.js and stored in the `dashboardCharts` object for quick access and management. Each chart has a unique ID (e.g. `chart-risk-diabetes`, `chart-risk-obesity`, `chart-factors`, `chart-distributions`, `chart-correlations`, `chart-age`, `chart-history`) and is created via the `upsertDashboardChart()` function, which creates a new Chart.js instance or updates an existing one. Charts are automatically updated when data changes and exported to PDF via canvas to image conversion.

**PDF Folder** — PDF generation is implemented through functions in `app.js` that use jsPDF to create documents. Functions include `generatePDFReport()` to generate the main report, `renderCoverPage()` for the cover, `renderContentPage()` for the main content, `exportChartsToPDF()` for exporting charts, `ensurePdfFontInitialized()` for loading Cyrillic fonts. PDF is generated entirely on the client without being uploaded to the server, which ensures speed and data confidentiality.

**Main logic: state management** — state management is implemented through JavaScript objects without using specialized libraries. The main state objects include `authState` for authentication (token, user, history, initialized), `predictionStore` for prediction results (stored by keys), `dashboardCharts` for charts (stores Chart.js instances), `chatState` for chats (selected chat, user list, unread messages), `apiStatusState` for monitoring (API, DB, Ollama, status history statuses). The state is updated synchronously through direct object changes and stored in LocalStorage for persistent data (token, theme settings, sidebar state).

**Basic logic: event bus** — Although the frontend does not use a formal event bus, communication between components is done through global functions and browser events. Events include `popstate` for navigating through browser history, `resize` for adapting charts to the window size, `click` for user interaction, `submit` for submitting forms, `keydown` for keyboard handling (e.g. Escape to close modal windows). Functions are called directly from event handlers or through event delegation on parent elements.

**Main logic: router (internal)** — routing is implemented through its own system without using external libraries (Navigo is used only as an auxiliary utility). The system includes the `ROUTE_SECTIONS` object for mapping URLs to section IDs, the `normalizePath()` function for normalizing paths (removing double slashes, handling aliases, converting to lowercase), the `getSectionByPath()` function for determining a section by URL, the `showSectionForPath()` function for activating a section with authentication verification, the `syncRouteFromLocation()` function for synchronizing the state with the URL, the `activateSection()` function for activating a specific section with updating navigation and localization.

**Basic logic: page initialization system** — page initialization is performed via the `activateSection()` function, which is called upon navigation. The function performs several steps: removes the `page--active` class from all sections and adds the `hidden` attribute, adds the `page--active` class to the target section and removes the `hidden` attribute, updates the active navigation state in the sidebar (adds the `nav-item--active` class to the corresponding menu item), applies localization to section items via `applyTranslations()`, and calls specific initialization functions for some pages (e.g. `initializeInsights()` for charts, `loadChatsList()` for chats, `loadApiStatus()` for API-status). This ensures that each page is properly initialized upon activation.

### 8.3. UI/UX logic

The UI/UX architecture of the frontend is organized through a system of components, animations, and adaptability to provide a user-friendly and intuitive interface.

**Notification system** — the notification system is implemented through the `showNotification()` function, which creates a toast notification in the upper right corner of the screen. Notifications support three types: `success` for successful operations (green left border, check-circle icon), `error` for errors (red left border, alert-circle icon), `info` for informational messages (blue left border, info icon). Notifications automatically disappear after a specified time (default 5 seconds) or can be closed manually via the close button. The system limits the number of simultaneous notifications (maximum 4), automatically deleting the oldest when the limit is exceeded. Notifications have animations of appearance (slide in from the right) and disappearance (slide out from the right) for smoothness. Each notification has a title and optional message, supports ARIA attributes for accessibility, and automatically updates Lucide icons after creation.

**Custom tooltips** — tooltips are implemented via the CSS pseudo-element `::after` for elements with the `data-tooltip` attribute. Tooltips are especially important for the collapsed state of the sidebar, where the navigation text is hidden, and the tooltips show the name of the menu item on hover. Tooltips have a semi-transparent background with a blur effect, a shadow for depth, a smooth animation of appearance (fade in + slide), and automatic positioning relative to the element. Tooltips are also used for buttons, icons, and other interactive elements to provide additional information to users.

**Dynamic modals** — modal windows are implemented through HTML structures with the `modal` class and overlay with the `modal__backdrop` class. Modal windows are used to confirm actions (delete predictions, clear history, log out), settings (theme, language), information (about the system, about risks), and errors. Modal windows have animations of appearance (fade in for overlay, slide up + scale for container) and disappearance (fade out + slide down), are closed when clicking outside them, pressing the Escape key, or the close button. Modal windows have a translucent backdrop with a blur effect, a centered container with content, action buttons (primary for confirmation, secondary for cancellation), and support focus trap for accessibility.

**Sidebar animation + expand/collapse** — the sidebar has a collapse/expand functionality via a toggle button at the top. When collapsed, the sidebar reduces its width, hides the navigation text, keeps only the icons, and changes the toggle icon from `panel-left-close` to `panel-left-open`. The sidebar state is stored in LocalStorage under the key `hr_sidebar_collapsed` and is restored when the page loads. The animation is performed via CSS transitions for smooth changes in width, padding, gap, and opacity. When collapsed, the sidebar uses tooltips to display menu item names on hover. The layout automatically adapts to the sidebar state via the `layout--sidebar-collapsed` class, which changes the grid-template-columns to properly position the content.

**Header adaptive logic** — The header (if present) adapts to the screen size via CSS media queries. On mobile devices, the header can collapse, hide some elements, or change font size and padding. The header can also contain status indicators (e.g., number of unread messages, API status) and adapt their display depending on the available space.

**User Blocking Logic** — User blocking is implemented via the `/users/block` and `/users/unblock` API endpoints, which create or delete entries in the `userblock` table. On the frontend, blocking is available via the user profile, where you can block or unblock another user. Blocked users cannot create chats, send messages, or be seen in active chats. The UI displays the blocking status via indicators and restricts interaction with blocked users. Blocking is checked on the backend when creating chats, sending messages, and retrieving a list of users.

**Checking..." Dot Animations** — The "Checking..." animation is used to indicate that Ollama is waiting for a response while generating an AI response. The animation is implemented through JavaScript, which adds dots gradually (".", "..", "...") at intervals of approximately 500 milliseconds. The animation starts before sending a request to the API and stops when a response or error is received. This provides a visual indicator that the system is processing the request and generating a response.

**Dynamic theme style change** — theme switching (light/dark) is implemented by changing the `theme-light` or `theme-dark` class on the `<body>` element. CSS variables are automatically updated depending on the class, which changes the colors, gradients, shadows, and transparency of all components. The theme is stored in LocalStorage under the `hr_theme` key and restored when the page loads. Theme switching is performed via a button in the sidebar, which changes the class to body, updates the icon (sun for light theme, moon for dark) and saves the selection in LocalStorage. The transition between themes has a smooth animation through CSS transitions for all colors and backgrounds.

### 8.4. Navigation and SPA mechanics

The frontend navigation system provides smooth navigation between pages without reloading through the History API and state synchronization with the URL.

**What is syncRouteFromLocation()** — This is a function that synchronizes the state of the SPA with the current URL in the browser. It is called when the page loads, the URL changes via the History API (Back/Forward buttons), or a programmatic route change. The function gets the current `pathname` from `window.location`, calls `showSectionForPath()` to activate the corresponding section, and updates the URL via `history.replaceState()` if the path has changed. This ensures that the URL always corresponds to the active section and allows you to use browser buttons to navigate through the SPA's history.

**How showSectionForPath() works** is a basic navigation function that determines and activates a section based on a URL. The function performs several steps: normalizes the path via `normalizePath()` (removes double slashes, handles aliases, converts to lowercase), determines the section via `getSectionByPath()` (finds the corresponding section in `ROUTE_SECTIONS`), checks authentication for secure routes (if the user is not logged in and the route is not public, calls `handleUnauthorized()` and redirects to `/login`), checks authentication initialization (if authentication is not yet initialized, waits and returns the path for further processing), activates the section via `activateSection()` (adds the `page--active` class, removes the `hidden` attribute, updates the navigation), returns the final path to update the URL. The function also handles special cases, such as redirecting logged-in users from `/login` to `/app` and handling routes with parameters (e.g. `/c/{chat_uuid}`, `/reset-password?token=...`).

**How public and protected routes work** — Routes are divided into public (accessible without authentication) and protected (requiring authentication). Public routes include `/login`, `/register`, `/forgot-password`, `/reset-password`, `/about` and are determined via the `isPublicRoute()` function. Protected routes include all other pages (`/app`, `/diagrams`, `/history`, `/profile`, `/assistant`, `/chats`, `/reports`, `/api-status`) and are determined via the `protectedSections` list. When attempting to access a protected route without authentication, the user is automatically redirected to `/login` via `handleUnauthorized()`. When a logged-in user attempts to access public routes (e.g. `/login` or `/register`), they are automatically redirected to `/app` for convenience.

**How the logic determines where to let / where to redirect** — the route definition logic is performed through several checks in `showSectionForPath()`: authentication check (if the user is not logged in and the route is not public → redirect to `/login`), initialization check (if authentication is not yet initialized → wait until it is initialized), route validity check (if the route does not exist in `ROUTE_SECTIONS` → redirect to `/app` for logged in users or `/login` for non-logged in users), user status check (if the user is logged in to `/login` or `/register` → redirect to `/app`), section activation (if all checks are passed → activate the section and stay on the route). The logic also stores the target route in `pendingRouteAfterAuth` to return after login if the user tried to access the protected route without authentication.

**Interaction with localStorage** — LocalStorage is used to store persistent data that needs to be persisted between sessions. Key data stored: `hr_auth_token` for the JWT authentication token, `hr_sidebar_collapsed` for the sidebar state (collapsed/expanded), `hr_theme` for the selected theme (light/dark), `hr_history_view` for the history view mode (list/grid), `hr_assistant_selected_prediction_{userId}` for the selected prediction in the assistant, `hr_assistant_latest_ts_{userId}` for the latest timestamp in the assistant. The data is read when the page loads and used to restore the state (authentication, settings, user selection). The data is updated when the state changes (login/logout, theme change, sidebar state change) and deleted when necessary (logging out clears the token).

### 8.5. API Interaction

The frontend's interaction with the API is organized through a centralized `apiFetch()` function, which encapsulates all HTTP requests and provides error handling, token addition, and response parsing.

**Asynchronous Call Principle** — All API requests are executed asynchronously via `async/await` for non-blocking processing. The `apiFetch()` function takes an endpoint path, HTTP options (method, body, headers), and processing options (skipAuth, skipAuthCheck) and returns a Promise with the response data. Using `async/await` allows you to write code in a synchronous style with error handling via `try/catch`, which simplifies readability and maintainability. All requests are executed via the native `fetch()` API, which is supported by all modern browsers and provides speed and reliability.

**Response validation** — response validation is performed at several levels: response status check (if `!response.ok`, it is treated as an error), Content-Type check (if the response contains `application/json`, it is parsed as JSON, otherwise it is processed as text), data structure check (a structured response according to Pydantic API schemas is expected), parsing error handling (if JSON is invalid, an error with a clear message is returned). Validation ensures that the frontend receives correct data and can process it correctly.

**API Errors** — error handling is performed centrally via `apiFetch()` with different logic for different status codes: 401 (Unauthorized) → automatic token clearing, user removal from state, redirection to `/login` via `handleUnauthorized()`, 400 (Bad Request) → display error message via notification, 403 (Forbidden) → display access denied message, 404 (Not Found) → display resource missing message, 422 (Unprocessable Entity) → display validation error details, 500 (Internal Server Error) → display general server error message. All errors are logged to the console for diagnostics and displayed to the user via a notification system with detailed messages.

**Automatic UI refresh after responses** — After successful API requests, the UI is automatically refreshed by calling the appropriate rendering functions. For example, after a successful prediction, `renderResult()` is called to display the results, after loading the history, `renderHistoryTable()` is called to update the table, after updating the profile, `updateProfileSection()` is called to display the new data, after loading chats, `renderChatsList()` is called to update the list. This ensures that the UI always displays the latest data after operations and the user sees the results of their actions.

**Using Tokens** — JWT tokens are used to authenticate all secure API requests. The token is stored in LocalStorage under the key `hr_auth_token` after a successful login or registration and is automatically added to all API requests via the `Authorization: Bearer <token>` header in the `apiFetch()` function. The token is validated when the page is loaded via the `/auth/me` endpoint to restore the user's session. When a 401 error is received, the token is automatically removed from LocalStorage and the state, and the user is redirected to `/login`. The token is also used for optional authentication on some endpoints (e.g. `/predict`), where the request can be made without a token, but is stored in the history only for authenticated users.

### 8.6. Generating PDF on the frontend

PDF report generation is performed entirely on the frontend via the jsPDF library, which ensures speed, data confidentiality, and formatting flexibility.

**Why jsPDF** — jsPDF was chosen for PDF generation due to several advantages: full client-side processing — PDF is generated in the browser without uploading data to the server, which ensures privacy and speed; ease of use — the library has an intuitive API for creating documents, adding text, images, and formatting; Cyrillic support — by downloading special fonts (DejaVuSans), you can generate PDFs with Ukrainian text; integration with Chart.js — charts can be easily exported to images and inserted into PDFs; ease of deployment — the library is loaded from a CDN, does not require server configuration; flexibility — you can fully control the structure, styles, and content of the PDF.

**Why PDF on the frontend, not on the backend** — PDF generation on the frontend has several advantages: reduced server load — generation is performed on the client, which reduces the load on the server and allows you to process more simultaneous requests; speed — generation on the client provides a fast response without waiting for processing on the server; confidentiality — data is not transmitted to the server for generation, which provides an additional level of confidentiality; flexibility — the frontend can easily change the format of reports without changes on the server; scalability — generation on the client does not limit the number of simultaneous requests for report generation; lack of dependence on the server — PDF can be generated even with limited server availability. The disadvantages are dependence on browser capabilities and the need to download additional libraries on the client.

**How the PDF structure is formed** — The PDF structure is formed through the `generatePDFReport()` function, which creates an A4 document (210x297 mm) and adds content in stages. The structure includes: a cover page (`renderCoverPage()`) with the system name, icon, generation date and theme (light/dark), a main page (`renderContentPage()`) with forecast information (target variable, probability, risk category), top influencers, recommendations and technical details, charts (`exportChartsToPDF()`) with exported Chart.js charts in PNG format, additional pages (if necessary) with detailed statistics, forecast history or other information. Each page has margins, inner margins and automatic text wrapping for optimal content placement.

**Chart generation (canvas → PNG → PDF)** — exporting charts to PDF is done by converting canvas elements to images. The process includes several steps: getting canvas elements for all charts on the page by their IDs, temporarily showing hidden canvases (if charts are on an inactive page), saving the initial canvas state (display, visibility, hidden) for restoration after export, exporting canvas to PNG via the `toDataURL('image/png')` method with high resolution, scaling images to fit on an A4 page while preserving proportions, inserting images into PDF via `doc.addImage()`, restoring the initial canvas state. Export is done for all available charts (risks, factors, distributions, correlations, history) and inserted into PDF in a logical order.

**Chart Alignment** — Charts are aligned on the PDF page by calculating dimensions in millimeters and automatically scaling. Each chart has a maximum width (usually 180 mm for an A4 page with margins) and height (depending on the chart type), a scaling factor is calculated to fit on the page while preserving the proportions, charts are centered horizontally by calculating the X position, charts are placed vertically with margins between them for readability. If the chart does not fit on the current page, a new page is created via `doc.addPage()`.

**Quality Optimization** - PDF quality is optimized through several mechanisms: high resolution canvas export (typically 2x or 3x the original size for sharp text and lines), image size optimization (PNG compression via quality settings if supported), use of vector fonts (DejaVuSans for Cyrillic provides sharp text at any scale), color optimization (use of RGB to accurately reproduce chart colors), page minimization (efficiently placing content to reduce file size). This ensures high quality PDF at a reasonable file size.

**Cyrillic issues and DejaVuSans usage** — jsPDF standard fonts do not support Cyrillic, so special DejaVuSans fonts are used to generate PDFs with Ukrainian text. Fonts are loaded asynchronously from the `fonts/DejaVuSans.ttf` (normal) and `fonts/DejaVuSans-Bold.ttf` (bold) files during the first PDF generation via the `ensurePdfFontInitialized()` function. Fonts are converted to base64 and added to the document via `doc.addFileToVFS()` and `doc.addFont()`. After adding fonts, they are used via `doc.setFont('DejaVuSans', 'normal')` or `doc.setFont('DejaVuSans', 'bold')` to correctly display Ukrainian text. Fonts are cached in memory for quick access during subsequent PDF generation.

### 8.7. Diagrams

Charts in the frontend are implemented through the Chart.js library, which provides interactive, responsive, and high-quality charts for data visualization.

**Chart.js as the main library** — Chart.js version 4.4.6 is used as the main library for building charts due to several advantages: ease of use — intuitive API for creating different types of charts, high quality — vector rendering via canvas ensures clarity at any scale, interactivity — support for tooltips, legends, scaling and other interactive elements, adaptability — automatic adaptation to the container size, animations — smooth animations of chart appearance and update, export — ability to export to image via `toDataURL()`, theme support — ability to customize colors and styles for light/dark theme. The library is loaded from the CDN via the `<script>` tag in HTML and is available globally via `window.Chart`.

**Chart File Architecture** — Charts do not have separate files, but are implemented through functions in `app.js` that create and update instances of Chart.js. Functions include `upsertDashboardChart()` to create or update a chart, `exportChartsToPDF()` to export charts to PDF, `initializeInsights()` to initialize all charts on a chart page, and specific functions for each chart type (e.g. `renderRiskCharts()` for risk charts, `renderFactorChart()` for factor charts). All Chart.js instances are stored in a `dashboardCharts` object with keys corresponding to the IDs of canvas elements for quick access and management.

**How charts are built and updated** — chart building is performed via the `upsertDashboardChart()` function, which accepts the canvas element ID, chart type, data, and configuration options. The function checks whether a Chart.js instance already exists for a given canvas (via `dashboardCharts[chartId]`), if so, updates the data via `chart.data = newData` and `chart.update()`, if not, creates a new instance via `new Chart(canvas, config)`. Updating is performed automatically when data changes (new forecasts, history updates, filter changes) via the `upsertDashboardChart()` call with new data. Chart.js automatically animates data changes for smooth updates.

**How to export to PDF** — Exporting charts to PDF is done via the `exportChartsToPDF()` function, which loops through all charts on the page, exports them to PNG via `chart.toBase64Image()` or `canvas.toDataURL('image/png')`, and inserts them into the PDF via `doc.addImage()`. The process includes temporarily showing hidden canvases (if charts are on an inactive page), saving the original state for restoration, exporting at high resolution (2x or 3x for clarity), scaling to fit on an A4 page, inserting into the PDF with proper alignment, restoring the original canvas state. Charts are exported in a logical order (risks, factors, distributions, correlations, history) and placed on separate pages or together depending on size.

**Canvas Features** — charts are rendered on canvas elements, which have several features: resolution — canvas has a fixed resolution, which is determined by the `width` and `height` attributes (not CSS dimensions), scaling — CSS dimensions can scale canvas, but the original resolution is important for export, transparency — canvas supports transparency via an alpha channel, which allows you to create overlays and effects, performance — canvas provides fast rendering even for complex charts with many data points, accessibility — canvas does not support native accessibility, so it is important to add alternative text via the `aria-label` attribute or hidden text.

**Rendering issues and solutions** — when working with charts, there are several problems and their solutions: hidden canvases are not exported — solution: temporarily show the canvas before exporting by changing display, visibility, and hidden, low export quality — solution: increase the canvas resolution before exporting by changing the width and height attributes, charts are not updated when the window size is changed — solution: add a `resize` event handler that calls `chart.resize()` for all charts, color conflicts with the theme — solution: update chart colors when changing the theme via `chart.options.plugins.legend.labels.color` and other options, memory is not freed when deleting charts — solution: call `chart.destroy()` before deleting the instance to correctly free memory.

### 8.8. System pages

System pages provide monitoring of the status of all system components and display of detailed information about their operation.

**`/api-status`** is the main system monitoring page that displays the status of the API, database, and Ollama server. The page includes status indicators for each component (online/offline via color indicators), response time graphs for performance monitoring, detailed statistics (number of requests, latency, errors), and status refresh buttons for manual data refresh. The page is automatically refreshed every 10 seconds via periodic queries to the `/health`, `/system/database/stats`, and `/assistant/health` endpoints. Statuses are stored in history for trending and performance analysis.

**`/api-status/history`** is the system status history page, which displays a chronological history of component status changes. The page includes a table or list of records with a timestamp, the status of each component (API, DB, Ollama), query latency, errors (if any), and details. The history allows you to track changes in the system state over time, identify problems, and analyze performance trends. The history can be filtered by component, date range, or event type (online/offline/error).

**Status animations** — Status indicators have animations to visually display changes: pulsation for online status (green indicator pulsates to show activity), spinning for waiting (spinner spins while checking status), fade in/out for status change (smooth color change when transitioning between states), slide in for new history entries (new entries appear with a slide in animation from above). Animations provide a smooth interface and draw attention to important status changes.

**System Health Indicators** — Health indicators display the current state of components through colored dots or badges: green for online (component is working normally), red for offline (component is unavailable), yellow for warning (component is working but with limitations), gray for unknown state (status is not determined). Indicators can also display numerical values (latency in milliseconds, number of errors) for detailed information. Indicators are updated in real time as statuses change and store history for analysis.

**Tab Concept** — The `/api-status` page can use tabs to switch between different system components (API, DB, Ollama) or different types of information (current status, history, statistics). Tabs are implemented through an HTML structure with toggle buttons and content containers that are shown/hidden via CSS classes. Tabs have an active state (highlighting the current tab), smooth transitions between tabs, and saving the selected tab to LocalStorage for restoration on the next visit.

**Ollama status monitoring** — Ollama monitoring includes checking the availability of the local Ollama server via the `/assistant/health` endpoint, measuring request latency (response time in milliseconds), displaying model status (which model is loaded, is it available), displaying errors (if Ollama is unavailable, detailed information about the error is displayed). Monitoring is performed periodically (every 10 seconds) and when manually updated via a button. Ollama status is critical for the operation of the AI assistant, so the indicator has a prominent location and detailed information about errors.

**Database Status** — database monitoring includes checking availability via the `/system/database/stats` endpoint, displaying statistics (number of users, forecasts, chats, messages), displaying database size (in bytes or megabytes), displaying activity over the last 7 days (number of new records, last activity). Database status is important for assessing system health and scaling planning. Database connection errors are displayed as critical and require immediate attention.

**System Load Graph** — Load graphs display the change in system performance over time through Chart.js line charts. The graphs include API latency (request response time), Ollama latency (response generation time), number of active users, number of requests per unit of time, database size over time. The graphs are built based on the status history stored in `apiStatusHistory` and `ollamaStatusHistory`, and are updated automatically as new records are added. The graphs allow you to identify trends, anomalies, and performance issues.

### 8.9. Implementation of AI assistant (interface part)

The AI assistant interface is implemented as a chat interface that integrates with the local Ollama server via API to generate personalized health recommendations.

**Chat interface** — The chat interface includes a message area with a history of the conversation, an input field for user messages, a send button, and an "Assistant is thinking..." indicator when generating a response. Messages are displayed as cards with different styles for user messages (right-aligned, light background) and assistant messages (left-aligned, darker background), include avatars (icons for the user and assistant), timestamps for each message, and text formatting (support for line breaks, links). The interface has a smooth animation of new messages (fade in + slide) and automatic scrolling to the last message when adding a new one.

**Interaction with the backend** — interaction with the backend is performed via the `/assistant/chat` endpoint, which accepts the user's message, an optional `prediction_id` for the context of a specific prediction, and the language (`uk` or `en`). The frontend sends a POST request with a JSON body, receives the assistant's response, and displays it in the chat. All messages are stored in the history via the `/assistant/history` endpoint, which returns all previous messages for display when the page loads. The history is loaded automatically when the assistant page is activated and is updated after each new message.

**Message logic** — message logic includes several aspects: sending messages — when the send button or Enter is pressed in the input field, the message is validated (empty check, maximum length), displayed in the chat as a user message, sent to the backend via the API, the "Checking..." indicator is displayed while waiting for a response; receiving a response — after receiving a response from the API, the "Checking..." indicator is replaced with the assistant's response, the response is displayed in the chat as an assistant message, the history is updated to display the new message; error handling — in case of an error connecting to Ollama or other errors, an error message is displayed in the chat with details and recommendations for the user.

**History saving** — the message history is stored in the database via the backend and loaded on the frontend when the assistant page is activated. The history includes all previous messages of the user and assistant, is stored chronologically, includes timestamps for each message, and can be associated with a specific prediction via `prediction_id`. The history is displayed in the chat in chronological order with the ability to scroll to the beginning of the dialogue. The history can also be cleared via the `/assistant/history` (DELETE) endpoint to start a new dialogue.

**Automatic responses** — automatic responses are generated by Ollama based on the context about the user's health status, which is generated on the backend. The context includes information about the latest prognosis (target variable, probability, risk category, top factors), user input parameters (age, gender, BMI, blood pressure, laboratory parameters) and a system prompt with instructions for the assistant (do not diagnose, do not prescribe treatment, provide general recommendations). Responses are generated in Ukrainian or English depending on the `language` parameter in the query and include personalized recommendations based on the context.

**Dynamically resizing textarea** — The message input field is implemented as a textarea that automatically changes height based on the content. When text is entered, the textarea expands vertically to fit all the text without scrolling, has a maximum height (usually 4-5 lines), after which vertical scrolling appears. Resizing is done via JavaScript, which sets `textarea.style.height = 'auto'` to reset the height, then `textarea.style.height = textarea.scrollHeight + 'px'` to set a new height based on the content. This provides a convenient way to enter long messages without having to manually resize the field.

# Part 4: Database, Testing, Architecture, Security, and Infrastructure

## 9. Database (DATABASE)

### 9.1. General concept

The database in the HealthRisk.AI project acts as a central state repository for the web interface and API, storing all dynamic data that changes during system operation and must be persisted between user sessions.

**Why do you need a database** — a database ensures data persistence between user sessions, allowing you to store user profiles, prediction history, chats and messages, dialogue history with an AI assistant, user settings, and other information necessary for the system to work. Without a database, all data would be lost when the server reboots or the user session is closed, making the system impractical for real-world use. A database also ensures data integrity through transactions, foreign keys, and constraints, which prevents duplication and incorrect relationships between data.

**What is stored** — the database stores seven main types of data: user profiles (email, password hashes, names, dates of birth, gender, avatars, settings), forecast history (all executed forecasts with input parameters, results, models used, top influencers, creation dates), chats between users (unique chat identifiers, participants, creation and update dates, pinning, display order), chat messages (message text, senders, sending dates, read statuses), AI assistant messages (dialogue history with the assistant, author roles, context due to connection with forecasts), user blocking (information about blocking between users to prevent creating chats and sending messages), password recovery tokens (unique tokens, expiration dates, usage statuses).

**What are the main entities** — the database contains seven main entities that correspond to the tables: User (system users), PredictionHistory (prediction history), Chat (chats between users), ChatMessage (chat messages), AssistantMessage (AI assistant messages), UserBlock (user blocking), PasswordResetToken (password recovery tokens). Each entity has its own fields, constraints, indexes, and relationships with other entities through foreign keys, which ensures data structure and integrity.

### 9.2. Technical part

The technical implementation of the database is organized through SQLite as a lightweight file solution, SQLModel as an ORM for working with the database, and SQLAlchemy as a low-level layer for creating engines and sessions.

**SQLite as a lightweight solution** — SQLite was chosen as the main database due to several advantages: ease of deployment — does not require a separate DB server, all data is stored in a single file on disk, which simplifies deployment and backup; ease of maintenance — no need to configure a DB server, manage processes, monitor connections, which simplifies development and testing; sufficient performance — for average loads, SQLite provides fast access to data without network delays; transaction support — SQLite supports ACID transactions, which ensures data integrity; SQL support — standard SQL syntax allows you to use regular queries and integrate with ORM; built-in support in Python — the sqlite3 driver is built into Python, no additional dependencies are required.

**Why SQLite is suitable for local and R&D systems** — SQLite is ideal for local development and research projects because of: no need for a separate server — the developer can start the system immediately without configuring PostgreSQL or MySQL, which speeds up development; speed of development — no need to configure connections, create database users, manage access rights, which saves time; ease of testing — a test database can be created in memory or a temporary file, which provides fast and isolated tests; portability — the database file can be easily copied, transferred to another machine, or included in a backup; sufficiency for R&D — for a research project with a small number of users, SQLite provides sufficient performance without the complexity of a production database; ease of scaling — if necessary, you can easily migrate to PostgreSQL via SQLModel, which supports both databases.

**Where the database file is stored** — The database is stored in the `data/app.db` file relative to the project root. The `data/` directory is created automatically on first run via `DATA_DIR.mkdir(parents=True, exist_ok=True)` in the `db.py` module if it does not exist. The full path to the file is formed as `sqlite:///data/app.db` in the SQLAlchemy connection string format. The DB file contains all tables, indexes, constraints, and data in a single file, which simplifies backup (just copy one file) and migration to other machines.

**Table structure** — the table structure is defined via the SQLModel ORM model in the `src/service/models.py` file. Each model inherits from `SQLModel` with the `table=True` parameter, which tells SQLModel to create a table in the database. Fields are defined via `Field()` with data types (int, str, datetime, bool, dict for JSON), constraints (nullable, unique, index), foreign keys via `foreign_key="table.column"` and relationships via `Relationship()`. The structure is created automatically on first run via `SQLModel.metadata.create_all(bind=engine)` in the `init_db()` function, which is called in the `lifespan` FastAPI context manager at startup.

**Indexes** — indexes are created automatically for fields with the `index=True` parameter in `Field()` and for foreign keys. Primary indexes include: primary keys (automatically indexed), `email` in the `user` table (unique index for fast search of user by email), `user_id` in the `predictionhistory`, `assistantmessage`, `passwordresettoken`, `userblock` tables (indexes for fast search of user records), `token` in the `passwordresettoken` table (unique index for fast search of token), `uuid` in the `chat` table (unique index for fast search of chat by UUID), `chat_id` in the `chatmessage` table (index for fast search of chat messages), `sender_id` in the `chatmessage` table (index for fast search of sender messages), `user1_id`, `user2_id` in the `chat` table (indexes for fast search of user chats), unique composite index on `(user_id, blocked_user_id)` in the `userblock` table to prevent duplicate blocks. Indexes provide fast retrieval of records by key fields and improve query performance.

**Field types** — the database uses standard SQLite types with mapping via SQLModel: integer for numeric fields (id, user_id, chat_id), varchar/text for string fields (email, display_name, content), datetime for dates and times (created_at, updated_at, expires_at), boolean for logical fields (is_active, is_pinned, used), JSON (via SQLITE_JSON) for structured data (inputs in the predictionhistory table, which contains forecast input parameters, top factors, metadata). SQLModel automatically converts Python types to SQLite types when creating tables and converts SQLite types to Python types when reading data.

### 9.3. Main tables

The database contains seven main tables, each of which performs a specific role in the system and has its own relationships with other tables.

**The user table** is the central table of the system that stores the profiles of all users. The table contains the following fields: `id` (primary key, auto-incrementing integer), `email` (unique, indexed, required string for email), `hashed_password` (required string with bcrypt hash of password), `display_name` (required string for display name), `first_name`, `last_name` (optional strings for first and last name), `date_of_birth` (optional datetime for date of birth), `gender` (optional string: male/female/other), `avatar_url` (optional string for URL of uploaded avatar), `avatar_type` (required string: "generated" or "uploaded"), `avatar_color` (optional string for color of generated avatar), `is_active` (boolean, defaults to True for account activity), `created_at`, `updated_at` (datetime for tracking creation and update time). The table is used by the API for authentication (searching for a user by email, checking the password), profile management (updating data, changing the password, uploading an avatar), displaying user information on the frontend. The table is related to other tables via foreign keys: one user can have many entries in `predictionhistory` (one-to-many relationship), many messages in `assistantmessage` (one-to-many relationship), many chats via `user1_id` and `user2_id` in the `chat` table (many-to-many relationship), many password recovery tokens (one-to-many relationship), many blocks via `user_id` and `blocked_user_id` in the `userblock` table (one-to-many relationship, bidirectional).

**The predictionhistory table** is a table for storing all health risk predictions made by users. The table contains the following fields: `id` (primary key, auto-incrementing integer), `user_id` (foreign key to the `user` table, indexed, required), `target` (required string: "diabetes_present" or "obesity_present" for the target prediction variable), `model_name` (optional string for the name of the ML model used), `probability` (required float, 0-1 for the probability of a positive class), `risk_bucket` (required string: "low", "medium" or "high" for the risk category), `inputs` (required JSON containing the input parameters of the prediction: age, gender, BMI, blood pressure, glucose, cholesterol, top influence factors, model metadata), `created_at` (datetime, automatically set upon creation). The table is used by the API to save prediction results after a successful prediction via `add_prediction_history()` in `repositories.py`, retrieve the history of user predictions for display on the frontend via `get_all_prediction_history()`, use in the AI assistant for context via the `assistantmessage` link via `prediction_id`, analyze risk trends over time, statistics for charts and reports. The table is related to the `user` table via the `user_id` foreign key (many-to-one relationship), which allows you to easily retrieve all user predictions and ensures automatic deletion of records when the user is deleted (if CASCADE is configured). The table is also related to the `assistantmessage` table via the optional `prediction_id` foreign key (one-to-many relationship), which allows the AI assistant to use the context of a specific prediction for more accurate recommendations.

**The chat table** is a table for storing chats between two users. The table contains the following fields: `id` (primary key, auto-incrementing integer), `uuid` (unique, indexed string, automatically generated via UUID for use in URLs), `user1_id` (foreign key to the `user` table, indexed, required — ID of the first participant), `user2_id` (foreign key to the `user` table, indexed, required — ID of the second participant), `created_at` (datetime, automatically set upon creation), `updated_at` (datetime, automatically updated when adding messages via `chat.touch()`), `is_pinned` (boolean, defaults to False for pinning important chats), `order` (integer, defaults to 0 for the order in which chats are displayed for drag and drop). The table is used by the API to create or retrieve an existing chat between two users via `get_or_create_chat()` in `repositories.py`, retrieve a list of a user's chats to display on the frontend, manage the order in which chats are displayed, and pin important chats. The table is related to the `user` table via two foreign keys `user1_id` and `user2_id` (a many-to-many relationship), which allows each user to have multiple chats with different users, and each chat is unique to a pair of users. The table is also related to the `chatmessage` table via a foreign key `chat_id` (a one-to-many relationship), which allows for easy retrieval of all chat messages.

**The chatmessage table** is a table for storing messages in chats between users. The table contains the following fields: `id` (primary key, auto-incrementing integer), `chat_id` (foreign key to the `chat` table, indexed, required), `sender_id` (foreign key to the `user` table, indexed, required — sender ID), `content` (required Text for the message text), `created_at` (datetime, automatically set upon creation), `read_at` (optional datetime, None means unread message). The table is used by the API to add messages to the chat via `add_chat_message()` in `repositories.py`, retrieve chat message history for display on the frontend via `get_chat_messages()`, track read status for counting unread messages via `mark_messages_as_read()`, build a history of conversations, sort messages by time for display on the frontend. The table is linked to the `chat` table via the foreign key `chat_id` (many-to-one relationship), which allows you to easily retrieve all chat messages and ensures that messages are automatically deleted when the chat is deleted (if CASCADE is configured). The table is also linked to the `user` table via the foreign key `sender_id` (many-to-one relationship), which allows you to easily retrieve information about the sender of the message.

**The assistantmessage table (AI assistant message)** is a table for storing the history of messages with the AI assistant for each user. The table contains the following fields: `id` (primary key, auto-incrementing integer), `user_id` (foreign key to the `user` table, indexed, required), `role` (required string: "user" for a user or "assistant" for an AI assistant), `content` (required Text for the message text), `created_at` (datetime, automatically set upon creation), `prediction_id` (optional foreign key to the `predictionhistory` table — a link to a specific prediction for the context). The table is used by the API to store user messages and assistant responses via `add_message()` in `repositories.py`, retrieve dialog history for display on the frontend via `get_user_messages()`, restore dialog context on subsequent requests for more accurate recommendations, and build chat history for display on the frontend. The table is linked to the `user` table via the foreign key `user_id` (many-to-one relationship), which allows storing a separate dialog history with the assistant for each user. The table is also linked to the `predictionhistory` table via the optional foreign key `prediction_id` (many-to-one relationship), which allows the AI assistant to use the context of a specific prediction for more accurate recommendations.

**The userblock table** is a table for storing information about blocking between users. The table contains the following fields: `id` (primary key, auto-incrementing integer), `user_id` (foreign key to the `user` table, indexed, required — ID of the blocking user), `blocked_user_id` (foreign key to the `user` table, indexed, required — ID of the blocked user), `created_at` (datetime, automatically set upon creation). The table is used by the API to add or remove blocks via `block_user()` and `unblock_user()` in `repositories.py`, to check for blocking between users via `is_user_blocked()` and `get_blocked_user_ids()` for filtering when creating chats, sending messages, and retrieving a list of users. The table has a unique composite index on the `(user_id, blocked_user_id)` pair to prevent duplicate blocks. The blocking is one-way — if user A has blocked user B, it does not mean that B has blocked A. The table is related to the `user` table through two foreign keys `user_id` and `blocked_user_id` (a one-to-many, bidirectional relationship), which allows one user to block many other users, and one user can be blocked by many others.

**The passwordresettoken table (password recovery tokens)** is a table for storing password recovery tokens that are generated when a "forgot password" request is made and sent to the user's email. The table contains the following fields: `id` (primary key, auto-incrementing integer), `user_id` (foreign key to the `user` table, indexed, required), `token` (unique, indexed, required string for a unique token), `expires_at` (required datetime for the token expiration time), `used` (boolean, False by default to indicate token usage), `created_at` (datetime, automatically set upon creation). The table is used by the API to create tokens when requesting a password recovery, to check the validity of the token when setting a new password, and to prevent token reuse through the `used` field. Tokens have an expiration date and can only be used once. The table is related to the `user` table via the foreign key `user_id` (a many-to-one relationship), which allows one user to have many tokens (for example, if requesting renewal multiple times).

### 9.4. Migrations (if there is logic)

Database migrations are implemented programmatically via the `migrate_add_missing_columns()` function in the `src/service/db.py` module, which adds missing columns to existing tables when the application starts.

**Creating new tables** — new tables are created automatically on first run via `SQLModel.metadata.create_all(bind=engine)` in the `init_db()` function, which is called in the `lifespan` FastAPI context manager at startup. The function checks for the existence of tables via `inspector.get_table_names()` and creates them if they do not exist, based on the SQLModel models defined in `src/service/models.py`. After creating the tables, a migration is performed to add missing columns via `migrate_add_missing_columns()`. This ensures that the database structure always matches the models, even if the models have been changed since the tables were created.

**Structure update** — updating the table structure is performed through the `migrate_add_missing_columns()` function, which checks for the presence of columns in the tables and adds missing ones through `ALTER TABLE`. The function uses the SQLAlchemy inspector to get a list of existing columns through `inspector.get_columns(table_name)`, compares them with the expected fields from the models, and adds missing columns through the SQL queries `ALTER TABLE table_name ADD COLUMN column_name TYPE`. Migrations are performed every time the application is launched, which ensures the database schema is up-to-date without the need to manually perform migrations. Currently, the migration system is simple and adds only new columns, without removing old ones or changing the types of existing columns.

**Adding new fields** — adding new fields to existing tables is done through `migrate_add_missing_columns()`, which checks for the presence of fields and adds missing ones. For example, for the `user` table, the function checks for the presence of the `avatar_type`, `first_name`, `last_name`, `date_of_birth`, `gender` fields and adds them if they are missing. For the `chat` table, the function checks for the presence of the `is_pinned` and `order` fields and adds them with default values. For the `userblock` table, the function creates the table if it does not exist, along with indexes. This allows you to add new fields to existing tables without losing data and without the need to manually execute SQL scripts. In the future, you can add a migration system (for example, Alembic) for more complex schema changes, including removing columns, changing types, renaming fields.

### 9.5. Working with the database in FastAPI

Working with the database in FastAPI is organized through the SQLAlchemy engine, sessions, and dependency injection to ensure transaction isolation and correct error handling.

**Connection Pool** — The SQLAlchemy engine is created once when the `db.py` module is imported via `create_engine()` and is used for all database connections. The engine is configured with `echo=False` (no logging of SQL queries) and `connect_args={"check_same_thread": False}` to support multithreading in ASGI. The engine automatically manages the connection pool, creating new connections as needed and reusing existing ones to optimize performance. SQLite supports concurrent reads, but only one writer at a time, which is sufficient for average local system loads.

**Asynchrony** — While FastAPI supports asynchronous operations via `async/await`, SQLite operations via SQLAlchemy are performed synchronously, as SQLite does not support native asynchrony. To work asynchronously with the database, you need to use asynchronous drivers (for example, aiosqlite for SQLite or asyncpg for PostgreSQL) and asynchronous versions of SQLAlchemy (SQLAlchemy 2.0 with async support). In the current implementation, all database operations are performed synchronously, but FastAPI processes them in a thread pool for non-blocking query processing. This provides sufficient performance for a local system, but for production with high load, you should consider switching to an asynchronous database (PostgreSQL with asyncpg) or a separate service for database operations.

**ORM or raw SQL work** — the project uses ORM (SQLModel) as the main way to work with the database, which provides type safety, data validation, and simplifies work with relationships between tables. SQLModel allows you to define models that are used both for API validation (via Pydantic) and for working with the database (via SQLAlchemy), which ensures data consistency. The repository layer in `src/service/repositories.py` encapsulates the logic of working with the database through SQLModel queries (for example, `select(User).where(User.email == email)`), which ensures code readability and simplifies testing. Raw SQL is used only for migrations via `text()` in the `migrate_add_missing_columns()` function, where it is necessary to perform `ALTER TABLE` queries that are not directly supported by SQLModel. This provides a balance between the convenience of ORM and the flexibility of raw SQL for special cases.

## 10. Testing (TESTING)

### 10.1. General overview

The testing system of the HealthRisk.AI project is organized according to the principle of multi-tiered architecture, which ensures verification of the correctness of logic, API stability, operation of ML models, UI, and integrations at different levels of abstraction.

**What exactly is tested in the system** — tests cover all key components of the system: business logic functions (password hashing, JWT tokens, risk calculation, top factors), API endpoints (authentication, prediction, history, chats, AI assistant), ML models (loading, prediction, probability ranges, determinism), interaction between components (API-DB, API-ML, full prediction query cycle), error handling (invalid data, unauthenticated requests, DB errors, ML errors), edge cases (extreme values, missing data, unrealistic parameter combinations). Tests ensure that the system works correctly during normal use, correctly handles errors and edge cases, and remains stable when the code changes.

### 10.2. Types of tests

The project uses several types of tests to ensure code quality and system functionality at different levels of abstraction.

**Unit tests** are tests of individual functions and utilities isolated from other system components. Unit tests cover business logic functions (password hashing via `get_password_hash()`, password verification via `verify_password()`, JWT token generation via `create_access_token()`, token decoding via `decode_token()`, risk calculation via `get_risk_bucket()`, top factors via `calculate_top_factors_simple()`), utilities (data converters, formatting, error handling, validation), Pydantic schemas (API input and output validation, type, range, field mandatoryity checking), small service classes (model registry, model loading, data processing). Unit tests are located in `tests/backend/unit/` for backend and `tests/ml/unit/` for ML, use mocks to isolate components and verify correct handling of valid data, edge cases, and invalid data with expected exceptions.

**Integration tests** are tests of interaction between system components. Integration tests cover API and database interaction (tests verify that the API correctly stores data in the database, reads data from the database, updates records, deletes records, handles database errors such as duplicate emails, non-existent records), API integration with ML models (tests verify that the API correctly loads models, performs predictions, processes input data, returns results in the correct format, stores prediction history), full prediction query cycle (tests verify the entire process from receiving input data via the API to saving the result in the database, including validation, processing, prediction, saving). Integration tests are located in `tests/backend/integration/`, use a test database (temporary SQLite) for isolation and automatic cleanup upon completion, use fixtures to prepare data (users, tokens, test data), and verify that all components work together correctly.

**E2E tests** are tests of complete user scenarios from start to finish. E2E tests cover complete user scenarios (registration → login → forecast → history → profile update), full cycle of working with the system (creating an account, performing a forecast, viewing history, generating a PDF report, using the AI assistant), navigation between pages (moving between sections, saving state, restoring after a reboot), authentication (login, logout, updating profile, changing password). E2E tests are located in `tests/backend/e2e/`, use a test database and a FastAPI test client to simulate the full cycle of user work and verify that all components work together correctly for realistic usage scenarios.

**API tests** are tests of endpoint correctness, request processing, data validation, and error handling. API tests cover login and registration endpoints (tests check successful registration, login with correct credentials, handling duplicate emails, invalid emails, empty passwords, incorrect credentials, inactive accounts), risk prediction (tests check diabetes prediction, obesity prediction, input validation, handling missing required fields, probability ranges, risk categories, top factors, saving to history), history (tests check retrieving prediction history, filtering by user, sorting by date, limiting the number of records), chats (tests can check creating chats, sending messages, retrieving chat history), API-status (tests can check the status of the API, DB, Ollama). API tests generate HTTP requests via `TestClient` with FastAPI, check response status codes (200 for successful, 400 for validation errors, 401 for unauthenticated, 403 for no rights, 404 for non-existent resources, 422 for Pydantic validation errors), check the structure of JSON responses (presence of fields, values, ranges, valid values) and check error scenarios (401, 403, 422 with detailed messages).

**ML model tests** are tests for correct model loading, prediction stability, input and output format compliance, and metric quality. ML tests cover model loading (tests check for champion models for diabetes and obesity, calibrated models, specific models by key, error handling in the absence of models), prediction logic (tests check for probability ranges 0-1, determinism of predictions, realistic data, sum of probabilities = 1), extreme values (tests check that the model does not fall at parameter extremes, returns valid results, handles unrealistic parameter combinations), missing data (tests check that the pipeline correctly handles None values through imputation, that predictions are stable with missing optional fields), model sensitivity (tests check that increasing risk factors increases the probability of a positive class, that the model responds to parameter changes logically and predictably). ML tests are located in `tests/ml/unit/` for unit tests and `tests/ml/experimental/` for experimental tests, use `@pytest.mark.skipif` markers to skip tests if a model is not found, and verify that models work correctly even with non-standard input data.

**Experimental tests (non-standard cases)** are tests of non-standard scenarios and edge cases to confirm the reliability of the system. Experimental tests cover extreme parameter values (maximum age 120, maximum BMI 60, maximum blood pressure 250, maximum glucose 400, minimum values, unrealistic combinations), missing data (one missing parameter, multiple missing parameters, all optional fields missing, processing through imputation), sensitivity of models to changes in factors (sensitivity to changes in BMI, glucose, age, checking that increasing risk factors increases the probability). Experimental tests are located in `tests/ml/experimental/` and `tests/backend/experimental/`, they help to detect problems with edge case handling, check the stability of models on non-standard data, confirm that the system does not crash with unexpected input data, ensure that the model returns valid results even at extreme values, and check that missing data handling works correctly.

### 10.3. Coverage

Code coverage by tests is tracked through pytest-cov and test structure analysis to identify uncovered parts of the code and improve test quality.

**What should be covered** — Test coverage should cover all critical parts of the system: authentication functions (password hashing, JWT tokens, password verification should be covered by unit tests to ensure security), Pydantic schemas (input and output data validation should be covered by unit tests to ensure data correctness), API endpoints (authentication and prediction should be covered by integration tests to ensure API stability), model loading (loading champion and specific models should be covered by unit tests to ensure correct loading), prediction logic (probability ranges, determinism should be covered by unit tests to ensure correct predictions), error handling (invalid data, unauthenticated requests, DB errors should be covered by tests to ensure system reliability), edge cases (extreme values, missing data should be covered by experimental tests to ensure stability).

**Why it matters** — Test coverage is important for ensuring code quality and system reliability: Early bug detection — tests help detect bugs before they reach production, which saves time and resources; Regression prevention — tests verify that code changes do not break existing functionality, which allows you to safely refactor and add new features; Behavioral documentation — tests serve as documentation of how the system should work, which helps new developers understand the code; Change confidence — high coverage provides confidence that changes will not break the system, which allows you to develop the project faster; Code quality — coverage helps identify uncovered code that may contain bugs or unused functionality; Integration with CI/CD — coverage can be integrated with CI/CD to automatically check code quality with each commit.

### 10.4. Organizing the test structure

The test structure is organized according to the principle of separation by test types and system components for ease of navigation and launching individual test groups.

**Where stored** — all tests are located in the root directory `tests/` relative to the project root. The structure is organized by test types and system components: `tests/backend/unit/` for backend unit tests, `tests/backend/integration/` for backend integration tests, `tests/backend/e2e/` for backend e2e tests, `tests/backend/experimental/` for backend experimental tests, `tests/frontend/unit/` for frontend unit tests, `tests/frontend/integration/` for frontend integration tests, `tests/frontend/e2e/` for frontend e2e tests, `tests/ml/unit/` for ML unit tests, `tests/ml/experimental/` for ML experimental tests, `tests/ml/metrics/` for model metrics tests, `tests/utils/` for test utilities (fixtures, test data generators), `tests/conftest.py` for common fixtures for all tests.

**Separation logic** — tests are separated by types and components for easy navigation and running: separation by types (unit, integration, e2e, experimental) allows you to run only the required type of tests to quickly check a specific part of the system, separation by components (backend, frontend, ml) allows you to run tests only for a specific component, which saves time during development, separate folders for utilities and fixtures allow you to reuse code between tests, which simplifies maintenance. This provides a clear organization of tests and makes it easy to find the necessary tests for a specific component or type.

**Plan for expansion** — the test structure is ready for future expansion: frontend folders (`tests/frontend/unit/`, `tests/frontend/integration/`, `tests/frontend/e2e/`) are created and ready for adding tests, backend experimental tests folder (`tests/backend/experimental/`) is ready for adding non-standard scenarios, metrics tests folder (`tests/ml/metrics/`) is ready for adding model quality tests, test utilities (`tests/utils/`) are ready for adding new test data generators and fixtures. This allows you to easily add new tests without changing the structure and ensures the scalability of the testing system.

## 11. System Architecture (ARCHITECTURE OVERVIEW)

### 11.1. General architecture

The HealthRisk.AI system architecture is organized according to the principle of multi-layered architecture with a clear separation of responsibilities between components. Each layer performs specific tasks and interacts with others through clearly defined interfaces.

**Component diagram** — the system consists of several large blocks: ETL & Data (fundamental layer for collecting, processing and preparing data), EDA (analytical layer for studying the prepared dataset), ML-models (intelligent layer for transforming medical parameters into risk assessments), Backend / API (central interaction layer that unites all components), Database (persistence layer for storing dynamic data), Frontend (SPA) (interface layer for user interaction), AI (Ollama) (auxiliary intelligent layer for AI-assistant), Reporting (report generation layer), Testing (quality assurance layer). Each block has its own responsibility and integrates with others to create a single system.

**Main blocks** — the main blocks of the system include: the ETL & Data block is responsible for collecting, processing and preparing data from raw NHANES tables to the cleaned combined dataset `health_dataset.csv`, the EDA block is responsible for studying the prepared dataset to understand distributions, correlations and patterns, the ML model block is responsible for training machine learning models and transforming medical parameters into risk assessments, the Backend / API block is responsible for the REST API for the frontend, performing ML inference, managing authentication, saving and reading data from the database, integrating with Ollama, the Database block is responsible for saving all dynamic system data, the Frontend (SPA) block is responsible for displaying the user interface, processing interaction, communicating with the API, generating reports, the AI (Ollama) block is responsible for providing an AI assistant to explain the results and provide recommendations, the Reporting block is responsible for generating PDF reports with forecasting results, the Testing block is responsible for checking the correctness of the operation of all system components.

**How they interact** — the interaction between the blocks is organized according to the principle of a unidirectional data flow: ETL → EDA → ML → API → Frontend. Data passes from raw tables through processing and analysis to trained models that are used in the API to process user requests. The frontend receives data via the API and displays it to users. The database stores all dynamic data and the API is used for persistence. The AI assistant and reports work as auxiliary services that use data from the main components to provide additional functionality. Testing verifies the correct operation of all components at different levels of abstraction.

### 11.2. Frontend

The frontend is implemented as a Single Page Application (SPA) in pure JavaScript without the use of frameworks, which provides a minimalist, standalone, and lightweight client with full system functionality.

**SPA + JS** — Single Page Application works through a single HTML file that contains all the page sections in a hidden state. When a page is loaded, the backend always returns the same HTML file regardless of the URL, and JavaScript determines which section to display based on the current URL. All sections are present in the DOM from the very beginning, but are hidden through CSS classes and the `hidden` attribute, which allows you to quickly switch between pages without additional HTTP requests. Switching sections is done by adding the `page--active` class and removing the `hidden` attribute for the active section and hiding all the others. JavaScript performs all the SPA logic, including routing, state management, working with APIs, PDF generation, working with charts, and integrating with an AI assistant.

**Router** — routing is implemented through its own system without using external libraries (Navigo is used only as an auxiliary utility). The system includes the `ROUTE_SECTIONS` object for mapping URLs to section IDs, the `normalizePath()` function for normalizing paths (removing double slashes, handling aliases, converting to lowercase), the `getSectionByPath()` function for determining a section by URL, the `showSectionForPath()` function for activating a section with authentication, the `syncRouteFromLocation()` function for synchronizing the state with the URL, the `activateSection()` function for activating a specific section with updating navigation and localization. Navigation between pages is performed without reloading the page via the browser's History API, which provides smooth navigation without reload delays and saves the browsing history for the user.

**Conditional-component logic** — although the frontend does not use the component architecture of frameworks, the logic is organized functionally through functions in `app.js` that are responsible for specific components. Components include forms (forecast form, login form, registration form, profile form), charts (Chart.js instances for different types of charts), modal windows (action confirmation, settings, information), notifications (toast notifications for successes, errors, information), sidebar (navigation, topic switching, statuses), chats (chat list, chat detail view, messages), AI-assistant (chat interface, message history). Each component has its own functions for initialization, update and cleanup, which ensures modularity and maintainability of the code.

### 11.3. Backend

The backend is implemented on FastAPI with a service-oriented architecture, where each component performs specific tasks and integrates with others through well-defined interfaces.

**Layers: routing, services, ML, DB** — the backend is organized according to the principle of a multi-layered architecture: the routing layer is responsible for processing HTTP requests and routing to the corresponding handlers via FastAPI routers (`src/service/api.py` for main endpoints, `src/service/routers/` for modular routers, `src/service/routes_auth.py` for authentication), the services layer is responsible for business logic and integration with external services (`src/service/services/assistant_llm.py` for integration with Ollama, `src/service/auth_utils.py` for authentication, `src/service/avatar_utils.py` for avatar management), the ML layer is responsible for loading and using ML models (`src/service/model_registry.py` for model registry, loading champion models, caching), the DB layer is responsible for working with the database (`src/service/db.py` for connection configuration, `src/service/models.py` for ORM models, `src/service/repositories.py` for CRUD operations). Each layer has its own responsibilities and interacts with others through clearly defined interfaces, which ensures modularity and maintainability of the code.

**Request → process → response scheme** — request processing in the backend is organized as a sequential pipeline: request (HTTP request comes to FastAPI via Uvicorn ASGI server, FastAPI determines the appropriate router based on URL and HTTP method, middleware processes the request for CORS, path normalization, logging), process (router calls the appropriate endpoint handler, dependency injection creates a DB session via `Depends(get_session)`, checks authentication via `Depends(get_current_user)` for protected endpoints, validates input data via Pydantic schemas, executes business logic via services and repositories, loads ML models via model registry for prediction, stores data in the DB via repositories, generates a response), response (handler returns data in Pydantic model format, FastAPI serializes the response to JSON, middleware processes the response to add headers, logging, HTTP response returned to the client). This provides a clear structure for processing requests and makes it easy to add new endpoints or change processing logic.

### 11.4. ML layer

The ML layer is responsible for loading trained models, performing inference, and returning results in a format that is convenient for the API and frontend.

**Loading Models** — Models are loaded into memory on first use via the model registry in `src/service/model_registry.py`. The model registry loads champion models (with calibrated versions prioritized) for each target variable (diabetes_present, obesity_present) from the `artifacts/models/{target}/` directory. Models are stored in `.joblib` format and loaded via `joblib.load()`. The registry caches loaded models in memory for quick access on subsequent queries, which ensures fast inference without having to reload from disk. Models can also be loaded by a specific key (e.g., "logreg", "random_forest") via the `load_model()` function if the user has selected a specific model instead of automatically selecting a champion.

**Inference** — inference is performed when requesting a prediction via the `/predict` endpoint. The process includes several steps: receiving user input parameters (age, gender, BMI, blood pressure, glucose, cholesterol) via the Pydantic schema `PredictRequest`, converting JSON data to a pandas DataFrame, passing the model through the pipeline (which performs imputation of missing values via `SimpleImputer`, standardization of numeric features via `StandardScaler`, one-hot encoding of categorical features via `OneHotEncoder`), obtaining the risk probability via `pipeline.predict_proba()`, determining the risk category (low, medium, high) based on the probability via the `get_risk_bucket()` function, calculating the top 5 influence factors via the `calculate_top_factors_simple()` function, generating a JSON response with the results. Inference is performed synchronously, but FastAPI processes it in a thread pool for non-blocking processing of other requests.

**Returning results** — Inference results are returned in JSON format via the Pydantic schema `PredictResponse`, which includes the fields: `probability` (risk probability 0-1), `risk_bucket` (risk category: "low", "medium" or "high"), `top_factors` (list of factors with their influence in percentage), `model_name` (name of the model used), `target` (target variable). The response can also include model metadata (version, training date, metrics) for display on the frontend. Results are stored in the DB via `add_prediction_history()` for prediction history (if the user is authenticated), allowing users to review their previous predictions and analyze changes in risks over time.

### 11.5. Database

The database acts as a persistence layer that stores all dynamic data and ensures persistence between user sessions.

**Persistence layer** — the database provides data persistence through the SQLite file `data/app.db`, which stores all data in a single file on disk. Data is stored in a structured way through tables with defined fields, types, constraints, and relationships between tables through foreign keys. SQLModel ORM provides an abstraction over SQL, allowing you to work with data as with Python objects, which simplifies working with the database and ensures type safety. The repository layer in `src/service/repositories.py` encapsulates the logic of working with the database, providing functions for CRUD operations (create, read, update, delete) for all entities, which ensures consistency and simplifies code maintenance.

**The principle of saving and reading** — data is saved through SQLite transactions, which guarantee atomicity of operations (all changes are performed together or not performed at all). When creating or updating a record, a DB session is created through `get_session()`, data is added or updated through SQLModel models, the transaction is committed through `session.commit()` upon successful completion or rolled back through `session.rollback()` upon errors. Data is read through SQL queries through SQLModel (for example, `select(User).where(User.email == email)`), which are automatically converted to SQL and executed through the SQLAlchemy engine. The results are returned as Python objects that can be serialized to JSON for the API or used directly in the code. This ensures reliable data storage and fast reading through indexes on key fields.

### 11.6. AI assistant

The AI assistant integrates with the local Ollama server to provide personalized health recommendations based on prediction results.

**Interaction with Ollama** — the backend interacts with Ollama via HTTP API via the `src/service/services/assistant_llm.py` module. The module generates a context about the user's health based on the latest forecast via `build_health_context()`, which receives data from the database about the user's latest forecast (target variable, probability, risk category, key factors) and formats them into a text context. The module constructs a prompt for LLM with instructions and context via `build_assistant_prompt()`, which includes a system prompt with instructions (the assistant does not diagnose or prescribe treatment), user context, and user request. The module calls Ollama via an HTTP POST request to `http://localhost:11434/api/generate` via `call_ollama()`, which sends the prompt to Ollama and receives a response from LLM. The response is processed and stored in the database via `add_message()` for the dialog history.

**History Processing** — The history of conversations with the AI assistant is stored in the `assistantmessage` table for each user. The history includes all previous messages from the user and the assistant, is chronologically ordered, includes timestamps for each message, and can be linked to a specific prediction via `prediction_id` for context. The history is loaded when the assistant page is activated via the `/assistant/history` endpoint, which returns all user messages sorted by time. The history is used to display the conversation on the frontend and can be used to improve the context of future responses (although currently the context is only generated based on the latest prediction).

**Response Algorithm** — The AI assistant's response generation algorithm includes several steps: receiving a user message via the `/assistant/chat` endpoint, generating a context about the user's health based on the latest prediction (or a specific prediction if `prediction_id` is specified), constructing a prompt with instructions, context, and the user's request, calling Ollama via the HTTP API to generate a response, processing the response from Ollama (which can be in NDJSON format for streaming), saving the user message and the assistant's response in the database, and returning the response to the frontend for display in the chat. The algorithm provides personalized recommendations based on the user's specific prediction results and health context.

**Context Caching** — The user's health context is generated based on the latest prediction from the database via `get_latest_prediction()`, which retrieves the latest entry from the `predictionhistory` table for the user. The context includes the target variable (diabetes or obesity), risk probability, risk category (low, medium, high), top influence factors, and prediction input parameters. The context is cached in memory at the query level to avoid repeated queries to the database, but is not persisted across queries to ensure data is up-to-date. In the future, context caching at the user session level may be added to improve performance when multiple queries are made to the assistant.

## 12. OLLAMA AI MODEL

### 12.1. What is Ollama?

Ollama is a local server for running large language models (LLMs) without the need to connect to cloud services, ensuring privacy, speed, and independence from external services.

**Local LLM** — Ollama allows you to run language models (e.g. Llama3, Mistral, Phi) locally on the user's computer or server, without the need to send data to external services. Models are loaded and run via an HTTP API, which allows for easy integration into applications. Ollama automatically manages model loading, caching in memory, and query processing, making working with LLM easier for developers.

**Why chosen** — Ollama was chosen for the HealthRisk.AI project because of several advantages: privacy — all user data (forecast results, requests to the assistant) remains local, not transmitted to external services, which is critically important for medical data; speed — local processing provides low latency without dependence on network delays; independence — the system works without the need for an Internet connection for the AI assistant, which ensures stable operation; free — Ollama and many models are free, no subscriptions to cloud services are required; flexibility — you can use different models depending on your needs, configure generation parameters, add your own prompts; ease of integration — the HTTP API allows you to easily integrate Ollama into any application without complex settings.

**How the integration works** — integration with Ollama is implemented through the `src/service/services/assistant_llm.py` module, which performs HTTP requests to the local Ollama server at `http://localhost:11434/api/generate`. The module generates a context about the user's health based on the latest forecast, constructs a prompt with instructions and context, sends a request to Ollama via `requests.post()`, processes the response (which can be in NDJSON format for streaming or regular JSON), stores the message in the database and returns the API response. The integration is simple and does not require complex settings, just start the Ollama server locally.

### 12.2. Integration Architecture

The architecture of integration with Ollama is organized through the `assistant_llm.py` module, which encapsulates all the logic of interaction with LLM and provides a clean interface for the API.

**API Calls** — interaction with Ollama is performed via HTTP POST requests to the `/api/generate` endpoint on the local server `http://localhost:11434`. The request contains JSON with the following fields: `model` (model name, for example "llama3"), `prompt` (prompt text with instructions, context, and user request), `stream` (boolean, whether to use streaming response), `options` (generation parameters: temperature, top_p, max_tokens). The response from Ollama can be in the format of regular JSON (if `stream=false`) or NDJSON (if `stream=true`), where each line contains part of the response. The module processes both formats and generates the final response for the API.

**Response processing** — processing the response from Ollama includes several steps: receiving an HTTP response from Ollama via `requests.post()`, checking the status code (200 for success, others for errors), parsing the JSON or NDJSON response, extracting the response text from the `response` field, handling errors (timeouts, connection errors, Ollama errors), generating a structured response for the API. If the response is in NDJSON (streaming) format, the module processes each line and assembles the complete response. Processing includes trimming extra spaces, removing special characters, and formatting the text for display on the frontend.

**Tokenization** — Ollama automatically tokenizes the input text (prompt) and generates tokens for the response, so the `assistant_llm.py` module does not perform tokenization directly. The module passes the full prompt text to Ollama, which itself performs tokenization through its model. Generation parameters (e.g. `max_tokens`) control the maximum number of tokens in the response, which allows you to limit the length of the response. The module does not require knowledge of the internal structure of Ollama tokenization, which simplifies integration.

**Prompts generation** — prompts are generated using the `build_assistant_prompt()` function in the `assistant_llm.py` module. The prompt consists of several parts: a system prompt with instructions for the assistant (the assistant does not diagnose, does not prescribe treatment, provides general recommendations), a context about the user's health (formed using `build_health_context()` based on the latest forecast), a user request (the text of the message from the user). The prompt is formed as a structured text with clear sections, which ensures clarity for LLM and correctness of answers. The system prompt includes restrictions and rules to ensure the safety and responsibility of answers.

### 12.3. Chat usage

The AI assistant is used in chat to provide personalized health recommendations based on the user's prediction results.

**Hint logic** — Hints for the user are generated based on the context of their last prediction via `build_health_context()`, which retrieves data from the database about the last prediction (target variable, probability, risk category, top factors). The context is formatted as a text description of the user's health status, which is passed to LLM along with the user's query. LLM uses this context to generate personalized recommendations that take into account the user's specific prediction results. Hints can include recommendations for risk reduction, lifestyle changes, doctor consultations, and other useful advice.

**Contextual Responses** — The assistant’s responses are informed by the context of the user’s most recent prediction, ensuring relevance and personalization. Context includes information about the target variable (diabetes or obesity), the probability of risk, the risk category (low, medium, high), top influencers (e.g., high BMI, elevated glucose), and the input parameters of the prediction (age, gender, blood pressure). LLM uses this context to generate responses that take into account the user’s specific situation and provide useful recommendations. The context is updated with each new prediction, ensuring the answers are relevant.

**Dialogue memory** — the history of dialogues with the AI assistant is stored in the `assistantmessage` table for each user, which allows you to track previous messages and responses. The history includes all messages from the user and the assistant, is chronologically ordered, includes timestamps for each message, and can be linked to a specific prediction via the `prediction_id` for context. Currently, the context is formed only based on the latest prediction, but in the future, the use of the full dialogue history can be added to improve context and ensure conversation consistency. The history is loaded when the assistant page is activated via the `/assistant/history` endpoint and is displayed on the frontend for the user.

### 12.4. Statuses and monitoring

Ollama health monitoring is performed through the `/assistant/health` endpoint, which checks server availability, measures latency, and returns status for display on the frontend.

**How Ollama status is checked** — the `/assistant/health` endpoint makes an HTTP request to the local Ollama server (`http://localhost:11434/api/generate`) with a test prompt ("ok"), measures latency (response time), checks for the presence of the `response` field in the response. The request is executed with a timeout of 10 seconds to prevent long waits. The result is returned as JSON with the fields: `status` ("online", "offline", "timeout", "error"), `is_available` (boolean), `latency_ms` (milliseconds), `error` (error text, if any), `timestamp`. Different types of errors are handled: `Timeout` (timeout 10 seconds), `ConnectionError` (Ollama not running), other errors (unexpected errors). The endpoint is called periodically from the frontend (every 10 seconds) to monitor the status of Ollama.

**Why it sometimes "hangs"** — Ollama may be unavailable for several reasons: the server is not running — if the Ollama server is not running locally, all requests will return `ConnectionError`; timeouts — if Ollama is loading a large model or processing a complex request, it may not have time to respond in 10 seconds, which leads to a timeout; model errors — if the model is not loaded or corrupted, Ollama may return errors; lack of resources — if the computer does not have enough memory or CPU, Ollama may run slowly or not run at all; port conflicts — if port 11434 is occupied by another process, Ollama will not be able to start. To solve problems, you need to check whether the Ollama server is running, whether the model is loaded, and whether there are enough system resources.

**How the status is displayed on the frontend** — Ollama status is displayed on the `/api-status` page via status indicators (green for online, red for offline, yellow for timeout), latency graphs (response time in milliseconds), detailed statistics (last status, average latency, number of errors), error messages (error text, time of last error). The frontend makes periodic requests (every 10 seconds) to the `/assistant/health` endpoint, stores the status history for graphing, and updates the UI when the status changes. The status indicators are displayed in the `/api-status` tab along with information about the API and the database.

## 13. Security

The HealthRisk.AI project security system is organized through a multi-layered approach that protects user data, APIs, and ML models from unauthorized access and malicious attacks.

**JWT tokens** — the authentication system uses JSON Web Tokens (JWT) to provide secure access to protected endpoints. JWT tokens are generated upon successful login via the `create_access_token()` function in the `auth_utils.py` module, which creates a token with the fields: `sub` (user email), `exp` (expiration time, default 60 minutes), `iat` (creation time). The token is signed via a secret key (SECRET_KEY with environment variables) using the HS256 algorithm, which ensures the integrity and authenticity of the token. The token is passed to the client in the API response and stored in `localStorage` on the frontend for further use. For each protected request, the token is passed in the `Authorization: Bearer <token>` header, where it is checked via `get_current_user()` to retrieve the user from the database.

**Refresh/Access** — currently the system uses only access tokens without a separate refresh mechanism. Access tokens have a validity period of 60 minutes, after which the user must log in again. In the future, refresh tokens with a longer validity period (for example, 7 days) can be added, which are stored in HTTP-only cookies for security and are used to automatically update access tokens without the need for repeated login. Refresh tokens should be stored on the server (in a DB or Redis) for the possibility of recall if necessary.

**CSRF — why it’s not needed in SPA** — Cross-Site Request Forgery (CSRF) protection is not needed in Single Page Application (SPA) because SPA uses AJAX requests via JavaScript, which automatically include cookies and headers from the same domain. CSRF attacks work through cross-site requests from other domains, but SPA always makes requests from the same domain where the frontend is hosted, so CSRF tokens are not needed. Additionally, CORS settings on the backend restrict requests to only from allowed domains, which provides additional protection against cross-site attacks. For additional security, you can use SameSite cookies and Content Security Policy (CSP) headers.

**Data Validation** — Input data validation is performed at several levels: Pydantic API-level schemas to validate the structure, types, ranges, and mandatory fields in the input data (e.g., `PredictRequest`, `LoginRequest`, `RegisterRequest`), business logic-level validation to verify the correctness of values (e.g., checking email for uniqueness, checking password for minimum length), database-level validation through constraints (unique, not null, foreign keys) to ensure data integrity. Pydantic automatically returns detailed validation errors (HTTP 422) with a description of the problems in each field, which allows the frontend to display understandable messages to users. Validation ensures that only correct data enters the system and is processed by ML models.

**Model validation** — ML models are validated in several stages: validation upon loading by checking the availability of model files, the correctness of the pipeline structure, the presence of necessary components (imputer, scaler, encoder, classifier), validation of input data before inference by checking the presence of mandatory features, value ranges, data types, validation of output data after inference by checking probability ranges (0-1), the presence of all required fields in the response, and the correctness of risk categories. Validation ensures that models work correctly and return valid results even with non-standard input data. Validation errors are handled and returned as HTTP 500 with detailed messages for logging.

**Password Handling** — User passwords are never stored in the clear, but only as bcrypt hashes via the `get_password_hash()` function in the `auth_utils.py` module. Bcrypt uses salt (a random salt for each password) and many hashing iterations (12 rounds by default), making brute-force attacks virtually impossible. When logging in, the password is verified via `verify_password()`, which compares the hash of the entered password with the hash in the database without storing the original password. Passwords are transmitted over HTTPS (if configured) to protect against interception during transmission. Minimum password length and complexity can be added via Pydantic validation for security.

**API Security** — API security is organized through several mechanisms: authentication via JWT tokens for secure endpoints (most endpoints require an authenticated user via `Depends(get_current_user)`), CORS settings to restrict requests only from allowed domains, input validation via Pydantic to prevent injection attacks, error handling without revealing internal system details (error messages do not contain call stack or file paths), rate limiting (may be added in the future) to prevent DDoS attacks. Public endpoints (e.g. `/health`, `/api-status`) do not require authentication, but do not return sensitive data. Security ensures that only authorized users can access secure resources and perform operations.

**The role of ML code isolation** — ML code is isolated from the main API via the `model_registry.py` module, which encapsulates all the logic for loading and using models. Isolation provides: security — models cannot be loaded or modified via the API, they are only accessible via internal code, injection protection — input data is validated before being passed to models, models do not execute arbitrary code, only process structured data, access control — only authorized users can perform predictions via the API, models are not directly accessible, testability — ML code can be tested in isolation from the API, which simplifies testing and debugging. Isolation ensures that ML models are only used via secure interfaces and cannot be compromised via the API.

**Why PDF is generated locally** — PDF reports are generated on the frontend via jsPDF instead of backend generation for several reasons: security — user data is not transferred to the server for PDF generation, all data remains locally in the browser, which reduces the risk of data leakage, performance — PDF generation on the client does not load the server, which allows you to process more requests at the same time, privacy — the user has full control over their data, the PDF is generated locally without transferring to the server, speed — PDF generation on the client is faster, as there are no network delays required to transfer data to the server and receive the finished PDF, scalability — PDF generation on the client does not require additional server resources, which allows you to scale the system without increasing the load on the server. PDF generation on the frontend ensures security, privacy, and system performance.

## 14. DevOps / Deploy / Infrastructure

The HealthRisk.AI project infrastructure is organized for local development and testing with the possibility of deployment to production servers.

**How to run the system locally** — the system is started locally in a few steps: installing dependencies via `pip install -r requirements.txt` for Python dependencies, setting environment variables via copying `.env.example` to `.env` and filling in the required values (SECRET_KEY, DATABASE_URL), initializing the database via automatic creation on first launch or via `make init-db` for manual initialization, starting the FastAPI server via `make run` or `uvicorn src.service.api:app --reload` for development with auto-reload, starting the Ollama server locally via `ollama serve` (if Ollama is installed) for the AI assistant, opening a browser at `http://localhost:8000` to access the web interface. The system automatically creates a database on first launch and configures all necessary components.

**Makefile** — Makefile contains commands for automating development and deployment: `make run` to start the FastAPI server with auto-reload, `make test` to run all tests, `make test-backend-unit` to run backend unit tests, `make test-coverage` to run tests with code coverage, `make init-db` to initialize the database, `make clean` to clean temporary files, `make lint` to check the code through linter. Makefile simplifies work with the project and ensures consistency of commands between different developers. Commands can be extended for additional tasks (for example, database migrations, documentation generation, deployment).

**Why Ollama in a dev environment** — Ollama is needed in a dev environment for testing and developing an AI assistant, as the assistant requires a local LLM server to generate responses. Without Ollama, the AI assistant does not work, and the `/assistant/chat` endpoint returns errors. Ollama allows developers to test the full functionality of the system locally without the need to connect to cloud services. For development, you can use lightweight models (e.g. Phi) for fast response generation, and for testing, full models (e.g. Llama3) for realistic responses. Ollama can be run in a Docker container for isolation or locally on the developer's computer.

**How environment variables work** — environment variables are stored in the `.env` file in the root of the project and are loaded via `python-dotenv` when the application starts. The main variables include: `SECRET_KEY` (secret key for JWT tokens, must be unique and random), `DATABASE_URL` (URL to connect to the database, default `sqlite:///data/app.db`), `OLLAMA_BASE_URL` (URL to the Ollama server, default `http://localhost:11434`), `DEBUG` (debug mode, default `False`). Variables are loaded via `load_dotenv()` in the `db.py` module and used via `os.getenv()` in the code. The `.env` file is not committed to Git (added to `.gitignore`) for security, and `.env.example` contains example values for new developers.

**What services are started** — the system requires several services to be started: FastAPI server (main backend, processes HTTP requests, performs ML inference, works with the database), Ollama server (local LLM server for the AI assistant, optional if the assistant is not needed), web server (Uvicorn is used for development, Gunicorn with Uvicorn workers can be used for production). The FastAPI server is the main service and must always be started. The Ollama server is needed only for the AI assistant and can be started separately. All services can be started locally or in Docker containers for isolation.

**How to deploy the system** — deploying the system to a production server includes several steps: preparing the server (installing Python, dependencies, setting environment variables), copying project files to the server (via Git, FTP or other methods), initializing the database via `make init-db` or automatically at first startup, starting the FastAPI server via systemd service or process manager (e.g. PM2, Supervisor), setting up a reverse proxy (e.g. Nginx) to handle HTTP requests and SSL certificates, starting the Ollama server (if an AI assistant is needed), setting up monitoring and logging. For production, it is recommended to use Gunicorn with Uvicorn workers for better performance and stability. The system can be deployed on cloud platforms (e.g. AWS, Google Cloud, Azure) or on your own servers.

**File backup** — backup includes several components: DB file (`data/app.db`) — the most important file that contains all user data, prediction history, chats, messages, should be copied regularly (e.g. daily) via `cp data/app.db backups/app_$(date +%Y%m%d).db`, ML models (`artifacts/models/`) — trained models that are difficult to restore, should be copied when changed, environment variables (`.env`) — sensitive data, should be stored securely, configuration files (`configs/`) — project settings, should be copied when changed. Backup can be performed manually or automatically via cron jobs or scripts. Backup files should be stored on a separate server or in cloud storage to protect against data loss.

**Logs** — logging in the system is performed through the standard Python logging module with different levels (DEBUG, INFO, WARNING, ERROR, CRITICAL). Logs are written to files (for example, `logs/app.log`) or output to the console depending on the settings. Logging includes: HTTP requests (URL, method, status code, processing time), errors (stack traces, error details, context), ML inference (execution time, models used, results), DB operations (queries, errors, transactions), AI assistant (queries to Ollama, responses, errors). Logs can be integrated with external monitoring systems (for example, ELK Stack, Sentry) for analysis and alerts. For production, it is recommended to use structured logs (JSON) for easier parsing and analysis.

## 15. Internationalization (i18n)

The HealthRisk.AI project's internationalization system provides support for multiple languages for the web interface and allows you to easily add new languages.

**Why it is needed** — internationalization is needed to ensure the accessibility of the system for users from different countries and languages, which expands the project audience and improves the user experience. For a master's project, internationalization demonstrates a professional approach to development and the readiness of the system for international use. Support for Ukrainian and English languages ensures accessibility for Ukrainian users and an international audience.

**Structure of JSON files** — translations are stored in JSON files in the `src/service/web/locales/` directory with the names `uk.json` (Ukrainian) and `en.json` (English). Each file contains structured keys for all texts in the application, organized by functional groups: `forms` (forms, input fields, buttons), `history` (forecast history, filters, sorting), `charts` (charts, legends, captions), `assistant` (AI assistant, messages, tips), `errors` (error messages, validation), `navigation` (menu, links, titles), `common` (common texts, confirmations, notifications). The key structure is hierarchical through nested objects (e.g. `forms.targets.diabetes_present`, `history.empty.title`), which makes it easy to organize and find translations. Each key contains the translation text for the corresponding language.

**Language loading principle** — languages are loaded via the `i18n.js` module on the frontend, which determines the user's current language from `localStorage` (key `healthrisk_lang`) or from the browser settings (via `navigator.language`). The module loads the corresponding JSON file via `fetch()` and stores translations in memory for quick access. If the language is not supported, Ukrainian is used as a fallback. The loading is performed during page initialization and can be repeated when changing the language. The module provides the `i18n.t(key, vars)` function to get the translation by key with optional variables for interpolation (for example, `i18n.t('history.count', {count: 5})`).

**How to switch languages** — language switching is done via a button in the sidebar or settings, which calls the `setLanguage(lang)` function in the `i18n.js` module. The function saves the selected language to `localStorage` (key `healthrisk_lang`), loads the corresponding JSON file with translations, calls `applyTranslations()` to update all texts on the page, and updates the `lang` attribute on the `<html>` element to display the text correctly. Language switching does not require a page reload, all texts are updated dynamically via JavaScript. The current language is saved between sessions via `localStorage`, so the user does not need to select the language again on the next visit.

**Attribute localization** — Localization of HTML element attributes is performed through special attributes with the `data-i18n-` prefix: `data-i18n-title` for the `title` attribute, `data-i18n-placeholder` for the `placeholder` attribute, `data-i18n-aria-label` for the `aria-label` attribute, `data-i18n-alt` for the `alt` attribute in images. The `applyTranslations()` function traverses all elements with these attributes, finds the translation via `i18n.t()`, and sets it as the value of the corresponding attribute. This provides localization of not only visible text, but also auxiliary attributes for accessibility and UX. Attribute localization is performed together with text localization on page load and language change.

**Localization of UI components** — UI components are localized via the `data-i18n` attribute on HTML elements, which contains the translation key. The `applyTranslations()` function iterates over all elements with this attribute, finds the translation via `i18n.t()`, and sets it as the `textContent` of the element. Components include: forms (labels, placeholders, buttons, validation messages), navigation (menus, links, headers), notifications (toast notifications for success, errors, information), modal windows (titles, texts, confirmation buttons), charts (legends, axis labels, tooltips), AI assistant (messages, hints, statuses). Localization is performed when components are initialized and is updated when the language is changed.

**Dynamic text support** — Dynamic texts (containing variables, such as record counts, usernames) are localized via the `i18n.t(key, vars)` function, which takes a translation key and an object with variables for interpolation. For example, `i18n.t('history.count', {count: 5})` replaces `{count}` in the translation with the value `5`. Translations can contain placeholders in the format `{variable_name}`, which are replaced with values from the `vars` object. This allows you to create dynamic texts with variables without the need for string concatenation. Dynamic texts are used to display record counts, usernames, dates, times, and other variable values.

**Scaling for new languages** — adding a new language requires several steps: creating a new JSON file in the `locales/` directory with the same key structure as `uk.json` (e.g. `de.json` for German), adding the language code to the `SUPPORTED_LANGUAGES` array in `i18n.js` (e.g. `['uk', 'en', 'de']`), adding a language switch button in the UI (if needed), testing translations to check for correctness and completeness. The module automatically loads translations for the new language and uses Ukrainian as a fallback for missing keys. The key structure remains unchanged, which ensures consistency between languages. Adding a new language does not require any changes to the code, just add a JSON file with translations.

## 16. Performance Optimization

Performance optimization of the HealthRisk.AI project is organized at several levels to ensure fast system operation and a comfortable user experience.

**Why SPA needs optimization** — Single Page Application needs optimization for several reasons: large JavaScript file size (`app.js` has about 14667 lines), which can slow down page loading, large number of DOM elements (all sections are present in the DOM from the very beginning), which can slow down rendering, multiple API requests to retrieve data, which can create delays, complex operations (PDF generation, chart rendering) that can block the UI, lack of data caching between sessions, which leads to repeated requests. Optimization ensures fast page loading, smooth navigation, fast responses to user actions, and efficient use of browser resources.

**Optimizing Canvas Rendering** — Canvas rendering for Chart.js charts is optimized through several mechanisms: using `requestAnimationFrame` for smooth animation and chart updates, limiting chart refresh rates (e.g., no more than 60 FPS), using the `will-change` CSS property to optimize rendering, limiting the number of simultaneous charts on a page (show only visible charts), using `resizeObserver` to optimize chart resizing, caching chart data to avoid recalculations, using `debounce` to limit refresh rates when changing filters. The optimization ensures smooth chart rendering without lag or UI blocking.

**PDF Optimization** — PDF generation is optimized through several approaches: asynchronous font loading (DejaVuSans) to avoid UI blocking, using `requestIdleCallback` to generate PDF in browser idle time, limiting chart image size (scaling before adding to PDF), using `canvas.toDataURL()` with optimal quality parameters to balance size and quality, incremental PDF generation (generating one page at a time) to avoid UI blocking, displaying generation progress to inform the user. The optimization ensures fast PDF generation without UI blocking and preserves image quality.

**Query Memoization** — API query memoization is implemented by caching responses in memory at the query level to avoid repeated requests with the same parameters. Memoization includes: caching prediction results for the same input parameters (if the user repeatedly requests a prediction with the same data), caching prediction history to avoid repeated requests to the database, caching API/DB/Ollama statuses to limit the frequency of checks, caching user data (profile, settings) to avoid repeated requests. Memoization ensures response speed and reduces server load. The cache can be cleared when data changes or when the user logs out.

**AI Caching** — caching of AI assistant responses is implemented by storing the history of dialogs in the database and using it to form context without repeated requests to Ollama for the same questions. Caching includes: storing user messages and assistant responses in the `assistantmessage` table for later use, using dialog history to improve the context of future responses, caching the context about the user's health at the query level to avoid repeated requests to the database. Caching ensures the speed of responses and reduces the load on Ollama. In the future, caching of responses for the same questions can be added to further improve performance.

**JS Optimization** — JavaScript code optimization includes several approaches: code minification by removing comments, whitespace, and unused code (via tools like UglifyJS or Terser), code splitting into modules for lazy loading (loading only the necessary modules), using `async/defer` for scripts that do not block rendering, limiting the depth of function nesting to improve readability and performance, using `requestAnimationFrame` for animations and UI updates, and optimizing loops and array processing through efficient algorithms. Optimization ensures fast code execution and reduces page load time.

**Page loading optimization** — page loading optimization includes several mechanisms: lazy loading of sections (loading only the active section on the first visit), using `IntersectionObserver` for lazy loading of images and charts, caching of static resources (CSS, JS, fonts) via HTTP headers (Cache-Control), using CDN for fast loading of libraries (Chart.js, jsPDF, Lucide), minimizing the number of HTTP requests through file consolidation, using `preload` for critical resources, optimizing the order of script loading (critical scripts first). Optimization ensures fast page loading and improves user experience. In the future, you can add Service Workers for offline work and resource caching.

# Part 5: Visual reports, system pages, chat, UX, security and conclusions

## 17. Visual reports and PDF generation

### 17.1. PDF Report Concept

PDF reports in the HealthRisk.AI project serve as an official document that users can save, print, and use for consultations with doctors or analysis of their health risks.

**Why PDF** — PDF reports are needed for several reasons: portability — PDF files can be easily transferred, stored, and opened on any device without the need to access the web interface, officiality — PDF format is recognized as an official document that can be used for medical consultations, convenience — users can print reports, save them in folders, share with doctors, analyze changes in risks over time, completeness — PDF reports contain all the necessary information about the prognosis (probability, risk category, top factors, charts, recommendations) in a structured form, independence — reports do not depend on the availability of the web interface, users can view them even without the Internet. PDF reports are an important part of the user experience, as they provide users with a concrete result of their interaction with the system.

**What data is included** — The PDF report contains comprehensive information about the health risk prediction: a title page with the project name, generation date, user information (if authenticated), prediction results (target variable — diabetes or obesity, risk probability in percent, risk category — low, medium, or high), top influence factors (a list of the most important factors with their influence in percent, e.g., BMI — 35%, glucose — 28%, age — 15%), risk diagrams (visualization of probability, distribution of factors, correlations, prediction history), interpretation of results (explanation of what the risk category means, how to interpret the probability, what to do next), model metadata (name of the ML model used, version, training date, quality metrics), technical details (prediction input parameters, generation time, system version). All data is structured and formatted for easy reading and understanding.

**How the user interacts with the format buttons** — Users can export reports in different formats via buttons on the forecast history page or on the results page: "PDF" button — generates a PDF report with all charts, text, and formatting, "Excel" button — exports data to Excel format for spreadsheet analysis, "CSV" button — exports data to CSV format for import into other systems, "JSON" button — exports raw data to JSON format for programmatic processing. The buttons are located next to each forecast in the history and on the results page. When the PDF button is clicked, an overlay "Generating PDF report..." is displayed with a loading indicator that blocks the interface during generation. After generation is complete, the PDF is automatically downloaded via the browser. Other formats (Excel, CSV, JSON) are generated instantly without an overlay, as they do not require complex operations.

### 17.2. PDF structure

The PDF report has a clear structure with consistent information for easy reading and understanding.

**Title part** — the first page of the PDF contains title information: the project name "HealthRisk.AI" in large font, the subtitle "Health Risk Assessment System", the date of report generation in the format "DD.MM.YYYY HH:MM", information about the user (if authenticated) — name, email, date of birth, gender, project logo or icon (if any), system version or metadata about the report. The title page is designed in a professional style using corporate colors and fonts. It serves as the cover of the report and provides the first impression of the quality of the document.

**Risk** — the section with the prediction results contains: the target variable (diabetes or obesity) in large font, the probability of the risk in percent (for example, "Probability: 67%") with a visual indicator (progress bar or pie chart), the risk category (low, medium, high) with color coding (green, yellow, red), a short explanation of what this category means, recommendations for next steps (consultation with a doctor, lifestyle changes, monitoring indicators). The section is designed to quickly understand the main result without having to read the entire report.

**Factors** — the section with top influence factors contains: a list of the most important factors (usually the top 5) with their influence in percentage, visualization of factors in the form of horizontal bars or a pie chart, a description of each factor (what it means, how it affects the risk), recommendations for reducing the influence of each factor. Factors are sorted by influence (from the largest to the smallest) to focus attention on the most important. Each factor has a name (for example, "Body Mass Index (BMI)"), a value (for example, "32.5"), an influence in percentage (for example, "35%") and an explanation.

**Interpretation** — the section with the interpretation of the results contains: a detailed explanation of what the risk category means (low, medium, high), how to interpret the probability (which means 67% risk), what to do next (consult a doctor, change lifestyle, monitor indicators), warnings (the system does not make diagnoses, does not prescribe treatment, only provides a risk assessment), links to additional resources (if any). The interpretation is written in clear language without medical terms to ensure accessibility for all users.

**Models** — the model metadata section contains: the name of the ML model used (e.g., "Logistic Regression", "Random Forest"), the model version or training date, model quality metrics (ROC-AUC, Accuracy, Precision, Recall), calibration information (whether a calibrated version is used), model description (how it works, what data it uses). Metadata provides transparency to the system and allows users to understand how the result was obtained. This is important for trust in the system and for medical consultations.

**Date/Metadata** — The last page of the PDF contains technical metadata: date and time the report was generated, system or API version, prediction input parameters (age, gender, BMI, blood pressure, glucose, cholesterol), unique report identifier (if any), copyright or license information, usage disclaimer (the system is not a substitute for consulting a doctor). Metadata is useful for tracking changes over time, diagnosing problems, and ensuring system transparency.

### 17.3. PDF Generation

PDF generation is performed entirely on the frontend via the jsPDF library, which ensures speed, security, and server independence.

**Why jsPDF** — jsPDF was chosen as the main library for PDF generation due to several advantages: client-side generation — PDF is generated on the client, which reduces server load and ensures speed, security — user data is not transmitted to the server for generation, all data remains locally in the browser, ease of use — intuitive API for creating PDF documents with text, images, tables, formatting support — ability to customize fonts, colors, sizes, indents, multi-page support — automatic creation of new pages when overflowing, image support — ability to insert images (diagrams) into PDF, widespread use — popular library with active support and documentation. jsPDF is loaded from CDN via `<script>` tag in HTML and is available globally via `window.jsPDF` or `window.jspdf.jsPDF`.

**Fonts + Cyrillic problem** — jsPDF's standard fonts do not support Cyrillic, so special fonts are used to generate PDFs with Ukrainian text. The Cyrillic problem occurs because jsPDF uses fonts that support only Latin by default. When trying to use Cyrillic with standard fonts, the text is displayed as empty squares or incorrect characters. This is a critical problem for Ukrainian localization, since all texts in the PDF must be in Ukrainian.

**DejaVuSans Solution** - To solve the Cyrillic problem, DejaVuSans fonts are used, which support Cyrillic and many other languages. DejaVuSans is a free font with full Unicode support, including Cyrillic, Greek, Arabic and other scripts. The fonts are stored in the files `fonts/DejaVuSans.ttf` (regular) and `fonts/DejaVuSans-Bold.ttf` (bold) in the frontend directory and are loaded asynchronously during the first PDF generation.

**Local font loading** — Font loading is performed via the `ensurePdfFontInitialized()` function, which checks if the fonts are already loaded and loads them if needed. The process includes: loading TTF files via `fetch()` from the local directory, converting fonts to base64 for inclusion in PDF, adding fonts to the jsPDF Virtual File System (VFS) via `doc.addFileToVFS()`, registering fonts via `doc.addFont()` with the name and style (normal, bold) specified, caching the loaded fonts in memory for quick access during subsequent generations. Fonts are loaded once during the first PDF generation and are used for all subsequent generations without reloading.

**PDF layout in code** — PDF layout is performed programmatically via the jsPDF API: creating a document via `new jsPDF()` with format parameters (A4: 210x297 mm), setting the font via `doc.setFont('DejaVuSans', 'normal')` or `doc.setFont('DejaVuSans', 'bold')`, adding text via `doc.text(text, x, y)` with coordinates in millimeters, setting the font size via `doc.setFontSize(size)`, setting the text color via `doc.setTextColor(r, g, b)`, adding images via `doc.addImage(imageData, format, x, y, width, height)`, creating new pages via `doc.addPage()` when overflowing, saving the PDF via `doc.save(filename)`. Layout is performed sequentially with calculation of element positions, indentations, and sizes for optimal placement of content on the page.

**Adaptability for different data** — The PDF report adapts to different amounts of data by: automatically creating new pages when content overflows, calculating the height of the text to determine if a new page is needed, scaling charts to fit on the page while maintaining aspect ratio, truncating long texts with an ellipsis or moving them to a new page, dynamically arranging elements based on the availability of data (if there are no charts, the text takes up more space). Adaptability ensures that the PDF report looks professional regardless of the amount of data.

### 17.4. Generating graphs in PDF

Charts from Chart.js are converted to images and inserted into PDFs for data visualization.

**Chart.js → PNG conversion** — Chart.js charts are converted to PNG images via the `toBase64Image()` or `canvas.toDataURL('image/png')` methods. The process includes: getting the canvas element from the Chart.js instance via `chartInstance.canvas`, calling the `toBase64Image()` method to export the chart to a base64-encoded PNG image, setting a high resolution to ensure quality (e.g., scale 2x or 3x), handling errors (if the canvas is empty or the chart is not rendered), saving the image as a data URL for transfer to jsPDF. The conversion is performed for all charts on the page before generating the PDF.

**Blank canvas issue** — The blank canvas issue occurs when a chart is not rendered or hidden during export. The canvas can be blank because: the chart is not initialized, the chart is hidden via CSS (`display: none` or `visibility: hidden`), the chart is not updated after data changes, the canvas has no dimensions (width or height = 0), the chart has not yet completed its appearance animation. A blank canvas results in a blank image or an image with an error being inserted into the PDF.

**Re-render solution** — To solve the problem of an empty canvas, the chart is re-rendered before export: temporarily showing the hidden chart via a CSS change (`display: block`, `visibility: visible`), updating the chart via `chartInstance.update()` to redraw, waiting for the rendering to complete via `requestAnimationFrame()` or `setTimeout()`, exporting the canvas after ensuring that it is full, restoring the chart to its original state (hiding if it was hidden). Re-render ensures that the canvas contains current data before export.

**Quality Optimization** - The quality of chart images is optimized by: setting high resolution when exporting (scale 2x or 3x for clarity), preserving the chart's proportions when scaling for PDF, using optimal quality settings for `toDataURL()` (quality 1.0 for maximum quality), limiting the image size to balance quality and file size, using PNG instead of JPEG to preserve the clarity of text and lines. Optimization ensures that charts look sharp in PDF without blurring or pixelation.

**Compression → Maintain Readability** — The balance between compression and readability is achieved by: using optimal scaling (2x for a balance between quality and size), limiting the number of charts per page (4 charts maximum), scaling charts to fit on the page without losing readability, using PNG instead of JPEG to maintain clarity, optimizing the canvas size before exporting (not too big, not too small). Compression is not done aggressively, as chart readability is more important than file size.

### 17.5. Multi-page layout

A PDF report can contain multiple pages to accommodate all the information and charts.

**4 graphs per page** — the optimal number of graphs per A4 page is 4 graphs (2x2 grid) to ensure readability and ease of viewing. The layout includes: calculating the dimensions of the graphs to fit 4 graphs per page with indentation, arranging the graphs in a 2x2 grid with even indentation, adding titles to each graph for identification, preserving the proportions of the graphs when scaling. If there are more than 4 graphs, new pages are created with the next 4 graphs.

**Centering** - Charts and text are centered on the page for a professional look: calculating the center of the page (A4 width: 210 mm, center: 105 mm), positioning elements relative to the center, centering text via `doc.text()` with the `align: 'center'` parameter, centering charts in a 2x2 grid. Centering provides a balanced page appearance and ease of reading.

**Aspect Control** — The proportions of the charts are preserved when scaling to fit the page: calculating the original proportions of the chart (width/height), calculating the maximum size to fit on the page with padding, scaling while preserving proportions (if the original width is larger than the height, it is scaled to the width, and vice versa), cropping the charts, if necessary, to fit the page. Aspect Control ensures that the charts do not look distorted in the PDF.

**Generate pages sequentially** — PDF pages are generated sequentially to ensure correct order and structure: create the first page (title page), add content to the first page, create a new page via `doc.addPage()` when overflowed, add content to the new page, repeat the process for all pages. Sequential generation ensures that content is in the correct order and does not overlap between pages.

## 18. System subpages

System subpages provide information about system status, work history, and general project information.

### 18.1. /api-status

The `/api-status` page displays the current status of all system components for monitoring and diagnostics.

**API Check** — API health check is performed via the `/health` endpoint, which returns information about API availability, version, number of routes, and timestamp. The frontend makes periodic requests (every 10 seconds) to this endpoint and displays the status via an indicator (green for online, red for offline). The status includes: API availability (online/offline), API version (if any), number of routes, last check time, request latency (response time in milliseconds). The information is displayed in the "API" tab on the `/api-status` page.

**Ollama Check** — Ollama health check is performed via the `/assistant/health` endpoint, which makes a test request to the local Ollama server and measures the latency. The frontend makes periodic requests (every 10 seconds) to this endpoint and displays the status via an indicator. The status includes: Ollama availability (online/offline/timeout/error), request latency (response time in milliseconds), model availability (if checked), error text (if any), time of last check. The information is displayed in the `Ollama` tab on the `/api-status` page.

**Availability Indicators** - Availability indicators are displayed through color indicators for quick understanding of the status: green indicator - the component is online and working correctly, red indicator - the component is offline or not responding, yellow indicator - the component is working but with delays or errors, gray indicator - the status is unknown or not checked. The indicators are updated automatically with each status check and can be updated manually via the "Refresh" button.

**"Checking..." animation** - During a status check, a "Checking..." animation is displayed with three dots that animate sequentially to indicate the check process. The animation is performed via CSS animations or JavaScript and disappears after a response is received from the server. The animation ensures that the user sees that the system is working and processing the request.

**Tabbed interface** — The `/api-status` page uses a tabbed interface to switch between different components of the system: "API" tab — API status, version, routes, "Database" tab — DB statistics, number of records, size, activity, "Ollama" tab — Ollama status, latency, errors. The tabbed interface is implemented through an HTML structure with CSS for styling and JavaScript for switching tabs. The active tab is highlighted in color or underlined for visual distinction.

### 18.2. /api-status/history

The `/api-status/history` page displays the history of system component statuses for trend analysis and problem diagnosis.

**Load log** — the load log stores the history of requests to the API, DB, and Ollama for analyzing the system load. The log includes: time of each request, response latency, status (success/error), request type (API, DB, Ollama), error details (if any). The log is stored in memory on the frontend (array `apiStatusHistory`, `ollamaStatusHistory`) and can be saved in the DB for long-term analysis. The log allows you to identify load patterns, activity peaks, and performance issues.

**Response Time** — Response time is measured for each request to system components and displayed as a graph to visualize trends. The graph shows: API latency in milliseconds, DB latency in milliseconds, Ollama latency in milliseconds, trends of increasing or decreasing latency, latency peaks (may indicate problems). The graph is automatically updated with each status check and allows you to identify performance issues.

**The idea of an “uptime graph”** — an uptime graph displays the percentage of time a component was online over a given period (e.g., the last 24 hours, week, month). The graph shows: online periods (green bars), offline periods (red bars), total uptime in percentage, longest offline periods, shortest offline periods. An uptime graph allows you to assess the reliability of the system and identify availability issues.

**How statistics are collected** — statistics are collected by periodically querying (every 10 seconds) the status endpoints and storing the results in arrays on the frontend. Statistics include: time of each query, response latency, component status, errors (if any). Statistics are stored in memory and can be exported to JSON for further analysis. For long-term storage, statistics can be stored in the database via a separate table for status logs.

### 18.3. /about

The `/about` page provides general information about the project, its purpose, history, and technologies.

**What is the page for** — The `/about` page serves to: inform users about the project, its purpose and purpose, provide information about the technologies used, demonstrate a professional approach to development, provide contact information or links to additional resources, explain how the system works, what data is used, how to interpret the results. The page helps users understand the system and trust it.

**Structure** — The `/about` page has a structured layout with sections: the title "About the project" or "About", a description of the project (what it is, why, for whom), the history of the project (when it was created, who developed it, versions), technologies (what technologies are used, why they were chosen), data sources (NHANES, Kaggle, how the data is used), team or author (if any), contacts or links (if any), license or copyright. The structure ensures easy reading and understanding of the information.

**Project History** — The project history section contains: project creation date, project purpose (master's thesis, research, commercial project), development stages (ETL, EDA, ML, API, Frontend), project versions (if any), achievements or awards (if any), future development plans. The history helps users understand the context of the project and its evolution.

**Information Layout** — The information on the `/about` page is laid out for easy reading: using headings and subheadings for structure, dividing information into blocks with visual separation, using lists to list technologies or features, using icons or images for visualization, and responsive design for different screen sizes. The layout provides a professional look to the page and makes it easy to read.

## 19. Chat and AI assistant

The AI assistant provides personalized health recommendations based on the user's prediction results.

### 19.1. AI Assistant Assignment

The AI assistant serves as a supporting tool for users in understanding forecast results and receiving recommendations.

**Why is it in the system** — The AI assistant performs several functions: explaining the prediction results in understandable language, providing recommendations for risk reduction, answering users' questions about their health, providing context about risk factors and their impact, and helping to interpret technical terms and metrics. The assistant does not make diagnoses or prescribe treatment, but only provides general recommendations based on the prediction results.

**How it helps the user** — the assistant helps the user by: explaining what the risk category means (low, medium, high), interpreting the probability of risk (which means 67% risk), recommendations for next steps (consultation with a doctor, lifestyle changes), explaining risk factors and their impact, answering questions about health status in the context of the prognosis. The assistant works as a personal consultant, helping the user understand the results and make decisions.

**Types of answers** — the assistant provides different types of answers: informational answers (explanations of terms, metrics, factors), recommendation answers (what to do to reduce risks), explanatory answers (how to interpret results), cautionary answers (reminders of the need to consult a doctor), supportive answers (motivation to change lifestyle). All answers are written in clear language without medical terms to ensure accessibility.

### 19.2. Chat Architecture

The chat architecture is organized by dividing it into a frontend (UI) and a backend (processing logic).

**Two parts: front and back** — the chat consists of two parts: the frontend is responsible for displaying the chat interface, processing user input, displaying messages, controlling scrolling, animations, the backend is responsible for processing messages, forming context, calling Ollama, saving history, and validating data. The frontend and backend interact via REST API to transmit messages and receive responses.

**Message Flows** — a message flow is organized as a sequential process: the user enters a message in the text field, clicks the "Send" button, the frontend validates the message (not empty, not too long), the frontend sends a POST request to `/assistant/chat` with the message and an optional `prediction_id`, the backend stores the user's message in the database, the backend generates a context about the user's health status, the backend calls Ollama to generate a response, the backend stores the assistant's response in the database, the backend returns the response to the frontend, the frontend displays the response in the chat. The flow ensures correct message processing and history storage.

**JSON message processing** — messages are transmitted in JSON format via REST API: the request contains the fields `message` (message text), `prediction_id` (optional, for the context of a specific prediction), `language` (uk or en), the response contains the fields `response` (assistant response text), `timestamp` (response time), `context` (optional, the context that was used). JSON provides data structure and ease of processing on both sides.

**Saving history in the DB** — the history of dialogues is stored in the `assistantmessage` table for each user: each user message is stored with `role: "user"`, each assistant response is stored with `role: "assistant"`, messages are stored chronologically with timestamps, messages can be associated with a specific prediction via `prediction_id` for context. The history is loaded when the assistant page is activated via the `/assistant/history` endpoint and displayed on the frontend for the user.

### 19.3. AI Response Logic

The logic for forming AI assistant responses is organized through the formation of prompts, context, and Ollama invocation.

**Prompt generation** — the prompt is generated via the `build_assistant_prompt()` function in the `assistant_llm.py` module and includes: a system prompt with instructions for the assistant (the assistant does not make diagnoses, does not prescribe treatment, provides general recommendations), a context about the user's health status (generated via `build_health_context()` based on the latest forecast), a user request (the text of the message from the user). The prompt is generated as a structured text with clear sections for the clarity of the LLM.

**Context** — the context about the user's health is formed via the `build_health_context()` function based on the latest prediction from the database: getting the user's latest prediction via `get_latest_prediction()`, formatting the context as a text description (target variable, probability, risk category, top factors), adding the context to the prompt for LLM. The context ensures that the assistant provides personalized recommendations based on the user's specific results.

**Memory** — the dialogue memory is stored in the `assistantmessage` table for each user: all previous messages of the user and the assistant are stored chronologically, the history can be used to improve the context of future responses (although currently the context is formed only based on the last prediction), the history is loaded when the assistant page is activated and displayed on the frontend. In the future, the use of the full dialogue history can be added to improve the context and ensure the continuity of the conversation.

**How Ollama handles requests** — Ollama handles requests via HTTP API: the backend sends a POST request to `http://localhost:11434/api/generate` with JSON payload (`model`, `prompt`, `stream: false`), Ollama processes the prompt via LLM (e.g. Llama3), generates a response based on the prompt and context, returns a response in JSON format with a `response` field, the backend processes the response and stores it in the DB. Ollama runs locally, which ensures data privacy and response speed.

### 19.4. Chat UI Implementation

The chat UI is implemented to ensure convenient user interaction with the AI assistant.

**Adaptability** — The chat UI adapts to different screen sizes: on desktop, the chat occupies the entire available width with a fixed height, on mobile devices, the chat occupies the entire screen with adaptive dimensions, messages are automatically wrapped to a new line when overflowing, the "Send" button adapts to the screen size, the scroll adapts to the screen height. Adaptability ensures convenient interaction on all devices.

**Scroll-to-bottom system** — automatic scrolling to the last message is implemented by: calling `scrollIntoView()` for the last message when adding a new one, using `requestAnimationFrame()` for smooth scrolling, saving the scroll position when updating messages, and allowing manual scrolling to view old messages. Scroll-to-bottom ensures that the user always sees the last message without the need for manual scrolling.

**Context Limiters** — Context limiters ensure that the prompt does not exceed the LLM limits: limiting the length of the user message (e.g., a maximum of 1000 characters), limiting the length of the context (e.g., only the latest forecast, not the entire history), truncating long texts with the addition of an ellipsis, validating input data before sending. Limiters ensure that requests to Ollama do not exceed the limits and are processed correctly.

**Loading old messages** — loading old messages is done through the `/assistant/history` endpoint, which returns all user messages sorted by time: loading history when activating the assistant page, displaying messages in chronological order, ability to scroll up to view old messages, caching history for quick access. Loading ensures that the user sees the entire history of the dialogue with the assistant.

## 20. User Experience (UX) and Accessibility

UX and accessibility ensure a comfortable and inclusive user experience with the system.

### 20.1. UX principles

UX principles are focused on simplicity, clarity, and efficiency of interaction.

**Simple logic** — the system logic is organized to minimize complexity: the minimum number of steps to complete tasks (for example, a forecast in 3 steps: enter data, press a button, view results), intuitive navigation (understandable page names, logical arrangement of elements), predictable behavior (buttons work as the user expects), the minimum number of decisions for the user (the system provides recommendations, does not require complex choices). Simple logic ensures that users can use the system without training.

**Minimum buttons** — the interface contains only the necessary buttons to minimize confusion: basic actions (forecast, history, profile) are accessible via navigation, additional actions (export, settings) are accessible via context menus or icons, unused buttons are hidden, buttons have clear names or icons. The minimum number of buttons ensures a clean interface and ease of navigation.

**Accessible text** — The text in the system is written in understandable language: a minimum of technical terms, explaining complex concepts in simple words, using short sentences, using active rather than passive voice, using concrete rather than abstract words. Accessible text ensures that all users can understand the information without medical education.

**Proper hierarchy** — The hierarchy of information is organized to emphasize important elements: headings are used for structure (H1 for the main heading, H2 for sections, H3 for subsections), important information is highlighted by size, color, or bold, less important information is hidden behind expansion or on separate pages, and the order of elements is logical (top to bottom, left to right). A proper hierarchy ensures that users quickly find the information they need.

### 20.2. Animations

Animations are used to improve user experience and visual appeal.

**Hover** — touch animations (hover, click) provide visual feedback: changing the color of buttons when hovering (hover effect), changing the size or shadow when clicking (active effect), smooth transitions between states (transition), animations of the appearance of elements (fade in, slide in). Touch animations ensure that the user sees the system's reaction to their actions.

**Modals** — Modal window animations provide smooth opening and closing: fade in/out for overlay, slide down/up for modal window, scale in/out for emphasis, delay for sequential display of elements. Modal animations provide a professional look and smooth interaction.

**PDF Preloader** — The PDF preloader is displayed during PDF generation to inform the user: overlay with a semi-transparent background, loading indicator (spinner or progress bar), text "Generating PDF report...", loading animation (spinner rotation, dot animation). The preloader ensures that the user sees that the system is working and processing the request.

### 20.3. Accessibility

Accessibility ensures that the system can be used by people with disabilities.

**Contrast** - Color contrast ensures text readability: minimum contrast of 4.5:1 for regular text, minimum contrast of 3:1 for large text, use of dark theme to improve contrast, check contrast through tools (e.g. WCAG Contrast Checker). Contrast ensures that text is readable for all users.

**Alternative Text** — Alternative text for images ensures accessibility for screen readers: `alt` attribute for all images with a description of the content, `title` attribute for additional information, description of diagrams in text for users with limited vision. Alternative text ensures that users with screen readers can understand the content of the images.

**ARIA attributes** — ARIA attributes provide accessibility for screen readers: `aria-label` for describing elements, `aria-labelledby` for linking to headings, `aria-describedby` for additional description, `aria-hidden` for hiding decorative elements, `role` for defining the role of elements. ARIA attributes ensure that screen readers can interpret the interface correctly.

## 21. Backup and data storage

Backup ensures data safety and the ability to recover in case of loss.

**DB Backup** — database backup is performed by copying the `data/app.db` file to a separate server or to cloud storage: regular backup (e.g. daily via cron job), saving multiple backup versions (last 7 days, last 4 weeks, last month), encrypting backup for security, checking backup integrity before saving. Backup ensures that data can be restored in case of loss.

**File Handling** — File handling includes: saving user avatars in the `data/avatars/` directory, saving ML models in the `artifacts/models/` directory, saving datasets in the `datasets/` directory, saving logs in the `logs/` directory (if any). All files must be included in the backup for a full system restore.

**Where to store data** — data is stored in the `data/` directory in the root of the project: `data/app.db` — database, `data/avatars/` — user avatars, other data (if any). The `data/` directory should be included in `.gitignore` to prevent sensitive data from being committed to Git. Data should be stored on a separate server or in cloud storage for security.

**How to take a snapshot** — A snapshot of the system is performed by: copying the database file to a timestamp-named file (for example, `app_20240101_120000.db`), copying all files to the `data/` directory, saving configuration files (`.env`, `configs/`), creating an archive of all files for convenience. A snapshot allows you to restore the system to a specific state.

**Recovery** — System recovery is performed by: restoring the database file from backup, restoring files from the `data/` directory, restoring configuration files, verifying data integrity after recovery, testing the system to make sure everything is working correctly. Recovery ensures that the system can be recovered in the event of data loss.

**Migrations** — Database migrations are performed via the `migrate_add_missing_columns()` function, which adds missing columns to existing tables: automatic migrations at application startup, adding new columns without data loss, checking for column availability before adding. In the future, a migration system (e.g. Alembic) can be added for more complex schema changes.

## 22. Logging and Monitoring

Logging and monitoring provide tracking of system operation and problem diagnosis.

### 22.1. Backend logs

Backend logs record information about API operation, request processing, and errors.

**Successful Requests** — Successful requests are logged to track activity: request time, URL, HTTP method, status code, processing time, user (if authenticated). Logging successful requests allows you to track system load, popular endpoints, and activity peaks.

**Errors** — errors are logged to diagnose problems: error time, URL, HTTP method, status code, error text, stack trace, context (user, request data). Error logging allows you to quickly identify and fix problems.

**Important Events** — Important events are logged to track critical operations: user creation, password changes, user locking, forecast generation, DB errors, ML errors. Logging important events allows you to track system security and stability.

### 22.2. ML Logs

ML logs record information about the operation of ML models and prediction.

**Forecasting** — predictions are logged to track model usage: prediction time, model used, target variable, input parameters, result (probability, risk category), processing time. Prediction logging allows you to track model popularity, prediction quality, and performance.

**Metadata** — Model metadata is logged for version and quality tracking: model version, training date, quality metrics, load time, load errors. Metadata logging allows you to track model changes and their impact on quality.

### 22.3. System Status Monitoring

System status monitoring provides tracking of component availability.

**API** — API monitoring is performed via the `/health` endpoint, which checks API availability, version, number of routes. The status is displayed on the `/api-status` page with online/offline indicators.

**DB** — DB monitoring is performed via the `/system/database/stats` endpoint, which checks DB availability, number of records, size, activity. The status is displayed on the `/api-status` page with detailed statistics.

**Ollama** - Ollama monitoring is performed through the `/assistant/health` endpoint, which checks Ollama availability, latency, errors. The status is displayed on the `/api-status` page with indicators and latency graphs.

**Availability Check** - Availability checks are performed periodically (every 10 seconds) via automatic queries to status endpoints. The results are stored in memory for graphing and trend analysis.

## 23. Scaling

Scaling provides the ability to expand the system to handle more users and data.

**DB migration to PostgreSQL** — switching from SQLite to PostgreSQL provides better performance and scalability: support for concurrent queries, better performance for large amounts of data, support for replication and sharding, better tools for monitoring and optimization. The transition is performed by changing the connection string in `.env` and migrating data from SQLite to PostgreSQL.

**Moving models to a separate microservice** — Moving ML models to a separate microservice provides: independent scaling of ML components, use of GPU for faster inference, isolation of ML code from the main API, ability to use different programming languages for ML. The microservice communicates with the main API via REST API or gRPC.

**Horizontal API Scaling** — Horizontal API scaling enables processing of a larger number of requests: running multiple API instances on different servers, using a load balancer to distribute the load, using a shared database to synchronize data, using Redis for caching and sessions. Horizontal scaling allows processing of thousands of concurrent users.

**CDN for static files** — using a CDN for static files ensures fast loading: distributing static files (CSS, JS, fonts, images) across servers in different regions, caching files on the CDN for quick access, reducing the load on the main server. CDN ensures fast loading of pages for users from different regions.

**GPU inference for ML** — Using GPU for ML inference provides faster inference: processing thousands of predictions simultaneously, reducing processing time from seconds to milliseconds, enabling the use of more complex models, and saving CPU resources for other components. GPU inference is especially important for large models and high workloads.

## 24. Conclusion

The HealthRisk.AI system is a comprehensive machine learning-based health risk assessment solution that combines scientific research, technological implementation, and user experience into a single system.

**What the system does** — The HealthRisk.AI system provides users with the ability to assess their risks of developing diabetes and obesity based on their medical parameters (age, gender, BMI, blood pressure, glucose, cholesterol). The system uses trained ML models to predict the probability of risk, provides detailed information about influencing factors, generates visual reports in PDF format, provides an AI assistant to explain the results and recommendations. The system works as a web application with full functionality for user registration, saving prediction history, communicating with other users, and receiving personalized recommendations.

**Why it's useful** — The system is useful for several user groups: regular users get a quick assessment of their health risks without the need to consult a doctor, doctors can use the system as an auxiliary tool for assessing patient risks, researchers can use the system to analyze data and improve models, students can use the system to teach ML and health informatics. The system provides transparency in the risk assessment process through explanations of impact factors and model metadata, which ensures user trust.

**What is implemented** — the system implements a full cycle from raw data to the web interface: ETL process for processing the NHANES dataset, EDA for data analysis and feature selection, training ML models for risk prediction, calibrating models for realistic probabilities, FastAPI backend for query processing and ML inference, SQLite database for data storage, SPA frontend for user interaction, generation of PDF reports with charts, Ollama-based AI assistant for personalized recommendations, chat system between users, system status monitoring, internationalization (Ukrainian and English), testing system for quality assurance. All components are integrated and work together to create a fully functional system.

**What are the possibilities for the future** — the system has great potential for development: adding new risks (cardiovascular diseases, oncology, others), improving the accuracy of models through larger datasets and new algorithms, adding new features (reminders, monitoring indicators over time, integration with medical devices), moving to a cloud infrastructure for scalability, adding a mobile application for user convenience, integration with electronic medical records, adding telemedicine features, improving the AI assistant through larger models and RAG (Retrieval-Augmented Generation). The system can become the basis for a commercial product or continued scientific research.

**Why is this a high-level completed thesis** — the HealthRisk.AI project demonstrates a high level of technical implementation and scientific approach: comprehensiveness — the system covers the full cycle from data to the web interface, including ETL, EDA, ML, API, frontend, DB, AI, testing, technical complexity — use of modern technologies (FastAPI, SQLModel, Chart.js, jsPDF, Ollama) and architectural approaches (SPA, REST API, ORM, microservices), scientific validity — use of the official medical dataset (NHANES), scientific approach to feature selection and model training, calibration for realistic probabilities, practical utility — the system can be used by real users to assess health risks, provides specific results and recommendations, documentation — complete technical documentation in Ukrainian describing all aspects of the system, testing — the testing system ensures code quality and stability, scalability — the architecture allows you to easily scale the system for a larger number of users. The project demonstrates a professional approach to development, a deep understanding of technologies, and the ability to create complex systems, making it a high-level completed thesis that can be used as a basis for further research or a commercial product.
