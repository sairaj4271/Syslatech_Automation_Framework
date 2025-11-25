pipeline {
    agent any

    environment {
        // Use pre-installed NodeJS (Windows path)
        PATH = "C:/Program Files/nodejs/;${env.PATH}"

        // Run Playwright in CI mode
        CI = "true"

        // Use local browser binaries inside node_modules
        PLAYWRIGHT_BROWSERS_PATH = "0"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 40, unit: 'MINUTES')
    }

    stages {

        stage('🔄 Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/sairaj4271/Syslatech_Playwright.git'
            }
        }

        stage('📦 Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('🌐 Install Playwright Browsers') {
            steps {
                bat 'npx playwright install'
            }
        }

        stage('🧪 Run Playwright Tests') {
            steps {
                bat 'npx playwright test --workers=2 --retries=1'
            }
        }

        stage('📊 Generate Allure Report (Local)') {
            steps {
                script {
                    bat """
                        if exist allure-report rmdir /s /q allure-report
                        allure generate allure-results --clean -o allure-report || exit 0
                    """
                }
            }
        }

        stage('📁 Archive Reports') {
            steps {
                junit 'reports/results.xml'
                archiveArtifacts artifacts: 'allure-results/**', fingerprint: true
                archiveArtifacts artifacts: 'playwright-report/**', fingerprint: true
            }
        }

        stage('📤 Publish Allure Report') {
            steps {
                allure includeProperties: false,
                       jdk: '',
                       results: [[path: 'allure-results']]
            }
        }
    }

    post {

        success {
            echo "🎉 TESTS PASSED SUCCESSFULLY!"
        }

        failure {
            echo "❌ TEST FAILURE — Check Allure & Playwright reports!"
        }

        always {
            echo "🧹 Cleaning Workspace..."
            cleanWs()
        }
    }
}
