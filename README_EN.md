# Health Risk AI

![Health Risk AI Preview](previews/imgs/preview-1.png)

Health Risk AI is a comprehensive system for assessing and predicting health risks based on **National Health and Nutrition Examination Survey (NHANES)** medical data. The system uses advanced machine learning methods to transform medical indicators into personalized health risk assessments for diabetes and obesity development.

## 📊 Dataset

The system is built on **National Health and Nutrition Examination Survey (NHANES)** data — a large-scale study of health and nutrition status of the US population conducted by the Centers for Disease Control and Prevention (CDC).

**Data Source:** [National Health and Nutrition Examination Survey on Kaggle](https://www.kaggle.com/datasets/cdc/national-health-and-nutrition-examination-survey)

NHANES contains comprehensive health information, including demographic data, anthropometry, blood pressure, laboratory indicators, and other important health metrics, making it an ideal foundation for training health risk prediction models.

## 🎯 Key Features

- **Risk Prediction**: Assessment of the probability of developing diabetes and obesity based on medical indicators
- **AI Assistant**: Health assistant chat that explains results in simple terms
- **Data Visualization**: Interactive charts and graphs for risk analysis
- **Report Generation**: Export results in PDF, Excel, CSV, and JSON formats
- **Prediction History**: Track risk dynamics over time
- **Personalization**: User profile management and system settings

## 👤 Profile Management

Users can fully control their profile in the system.

![User Profile](previews/imgs/preview-2.png)
*User profile with account information*

![Change Password](previews/imgs/preview-3.png)
*Password change form for authenticated users*

![Delete Account](previews/imgs/preview-4.png)
*User account deletion form*

## 🔮 Risk Prediction

The system allows users to enter medical indicators and receive instant risk assessments based on trained machine learning models.

![Prediction Form](previews/imgs/preview-5.png)
*Form for entering data for risk prediction*

![Form with Demo Data](previews/imgs/preview-6.png)
*Form with autofilled demonstration data (notification "Demo data filled" in the upper right corner)*

![Prediction Results](previews/imgs/preview-7.png)
*Display of calculated prediction results with detailed risk information*

## 📄 Report Generation

The system supports generation of detailed reports in various formats with flexible display settings.

![Report List (List View)](previews/imgs/preview-8.png)
*Report generation page in list mode*

![Report List (Grid View)](previews/imgs/preview-9.png)
*Report generation page in grid mode*

![Report Theme Selection](previews/imgs/preview-10.png)
*Modal window for selecting report theme style: light or dark*

### PDF Reports

The system generates professional PDF reports with detailed result visualization.

![PDF Report Generation](previews/imgs/preview-11.png)
*PDF report generation process*

**Example Generated Reports:**
- [PDF Report: diabetes, dark theme, Ukrainian](previews/reports/pdfs/health_risk_report_diabetes_present_1763850582939.pdf)
- [PDF Report: obesity, light theme, English](previews/reports/pdfs/health_risk_report_obesity_present_1763855469409.pdf)

### Excel Reports

Data export to Excel format with formatting and style support.

![Excel Report Preview](previews/imgs/preview-12.png)
*Excel report preview before download*

![Excel Report Download](previews/imgs/preview-13.png)
*Excel report download*

**Example Generated Excel Reports:**
- [Excel Report: diabetes, light theme, English](previews/reports/excels/health_risk_report_diabetes_present_1763857736322.xlsx)
- [Excel Report: obesity, dark theme, Ukrainian](previews/reports/excels/health_risk_report_obesity_present_1763857765040.xlsx)

### CSV Reports

Simple and universal format for data analysis.

![CSV Report Preview](previews/imgs/preview-14.png)
*CSV report preview*

**Example Generated CSV Reports:**
- [CSV Report: diabetes, light theme, Ukrainian](previews/reports/csvs/health_risk_report_diabetes_present_1763857818239.csv)
- [CSV Report: obesity, light theme, English](previews/reports/csvs/health_risk_report_obesity_present_1763857861438.csv)

### JSON Reports

Structured format for programmatic data processing.

![JSON Report Preview](previews/imgs/preview-15.png)
*JSON report preview with clipboard copy functionality*

**Example Generated JSON Reports:**
- [JSON Report: diabetes, light theme, English](previews/reports/jsons/health_risk_report_diabetes_present_1763857908085.json)
- [JSON Report: diabetes, light theme, Ukrainian](previews/reports/jsons/health_risk_report_diabetes_present_1763857914892.json)

## 📈 Prediction History

Users can view all their previous predictions and analyze risk change dynamics.

![Prediction History (List View)](previews/imgs/preview-16.png)
*Table of all user predictions in list mode*

![Prediction History (Grid View)](previews/imgs/preview-17.png)
*Prediction table in grid mode with delete and recalculate functionality*

## 📊 Visualization & Analytics

The system provides powerful tools for data visualization and risk analysis.

![Charts: Key Indicators & Model Risks](previews/imgs/preview-18.png)
*Charts comparing profile key indicators with recommended limits and comparing calculated diabetes and obesity risks*

![Charts: Factor Importance & BMI Distribution](previews/imgs/preview-19.png)
*Indicators that most influenced the last prediction and body mass index (BMI) distribution in NHANES sample*

![Charts: Blood Pressure Categories & Cholesterol Levels](previews/imgs/preview-20.png)
*Distribution of blood pressure levels and total cholesterol in NHANES sample*

![Charts: Diabetes & Obesity by Age Groups](previews/imgs/preview-21.png)
*Analysis of the proportion of people with diabetes and obesity in different age groups of the dataset*

![Charts: Factor Correlations & Prediction History](previews/imgs/preview-22.png)
*Correlation matrix between main indicators and risk probability dynamics over time*

![Charts: Risk Category Distribution & Used Models](previews/imgs/preview-23.png)
*Statistics of predictions by risk categories and proportion of used machine learning models*

## 💬 Health AI Assistant

Integrated chat with AI assistant that helps understand prediction results and get recommendations in simple terms.

![Assistant Quick Replies](previews/imgs/preview-24.png)
*Health assistant chat with quick replies*

![AI Model Response](previews/imgs/preview-25.png)
*Detailed response from AI model to user question*

![Chat List](previews/imgs/preview-26.png)
*List of all created chats with assistant*

![Drag-and-drop for Chats](previews/imgs/preview-27.png)
*Drag-and-drop mode for changing chat order in list*

![Chat Conversation](previews/imgs/preview-28.png)
*Detailed conversation with AI assistant in specific chat*

## 📖 Additional Information

### About the System

![About System Page](previews/imgs/preview-29.png)
*Information page with system details*

![About System Page (Detailed)](previews/imgs/preview-40.png)
*Detailed description of the system and its capabilities*

### API Status & Monitoring

The system provides complete information about API status and all system components.

![API Status](previews/imgs/preview-30.png)
*API status monitoring page*

![Main API Routes](previews/imgs/preview-31.png)
*List of main API routes with documentation*

![API Method Details](previews/imgs/preview-32.png)
*Modal window with detailed description of specific API method*

![API Response Statistics](previews/imgs/preview-33.png)
*API response performance statistics*

![AI Model Status (Ollama)](previews/imgs/preview-34.png)
*Monitoring status of Ollama AI model*

![Ollama Error & Request Statistics](previews/imgs/preview-35.png)
*Error and request statistics for Ollama AI model*

![Database Statistics](previews/imgs/preview-36.png)
*Database state monitoring*

![System Activity](previews/imgs/preview-37.png)
*System activity over last 7 days and component status*

![Date Range Selection](previews/imgs/preview-38.png)
*Modal window for selecting date range to view statistics*

![Detailed API State History](previews/imgs/preview-39.png)
*Separate page with detailed API state history*

## 🔐 Authentication

The system uses secure authentication with JWT tokens.

![Login Form](previews/imgs/preview-41.png)
*System login form*

![Registration Form](previews/imgs/preview-42.png)
*New user registration form*

![Password Reset Form](previews/imgs/preview-43.png)
*Password reset request form*

![New Password Entry](previews/imgs/preview-44.png)
*New password entry form after reset*

## 🚀 Quick Start

### Installation

```bash
pip install -r requirements.txt
```

### Running the System

```bash
python3 -m src.service.api
```

After launching, open `http://localhost:8000/app` in your browser to access the web interface.

### Setting Up AI Assistant (Ollama)

To use the AI assistant, you need to install and run Ollama:

1. Install Ollama: see [official instructions](https://ollama.com)
2. Download model: `ollama pull llama3`
3. Run Ollama (usually runs on `http://localhost:11434`)

The assistant is not a medical consultation and does not make diagnoses. If there are no predictions, the assistant will ask you to first complete a risk assessment in the application.

## 🧪 Testing

The project contains a comprehensive testing system for backend, ML models, and experimental scenarios.

```bash
# All tests
make test

# Backend only
make test-backend

# ML only
make test-ml

# Experimental only
make test-experimental

# With code coverage
make test-coverage
```

## 🛠️ Technology Stack

### Backend
- **FastAPI** — modern web framework
- **SQLModel/SQLAlchemy** — ORM for database operations
- **SQLite** — database
- **JWT** — authentication
- **Pydantic** — data validation

### Frontend
- **Vanilla JavaScript** — SPA without frameworks
- **Chart.js** — data visualization
- **jsPDF** — PDF generation
- **xlsx-js-style** — Excel export
- **Navigo** — routing

### ML & Data Analysis
- **Pandas** — data processing
- **NumPy** — numerical computations
- **Scikit-learn** — machine learning
- **XGBoost** — gradient boosting
- **Matplotlib/Seaborn** — visualization

### AI Assistant
- **Ollama** — local LLM infrastructure
- **Llama3** — model for answer generation

## 📚 Documentation

Detailed project documentation is available in [DOC_UA_FULL.md](DOC_UA_FULL.md).

## ⚠️ Important Note

The system is created for **educational and analytical purposes**. It is **NOT a medical tool** and **does NOT replace consultation with a doctor**. Prediction results are not a diagnosis and are not intended for making medical decisions without supervision of a qualified medical professional.

## 👨‍💻 Author

**Kіnash Stanislav Andriyovych**

- GitHub: [neprostostas](https://github.com/neprostostas)
- Group: КНУС-23
- Institution: **Lviv Polytechnic National University**

