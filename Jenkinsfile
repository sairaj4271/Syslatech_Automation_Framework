pipeline {
    agent any

    environment {
        PATH = "C:/Program Files/nodejs/;${env.PATH}"
        CI = "true"
        PLAYWRIGHT_BROWSERS_PATH = "0"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 40, unit: 'MINUTES')
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/sairaj4271/Syslatech_Playwright.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Install Playwright Browsers') {
            steps {
                bat 'npx playwright install --with-deps'
            }
        }

        stage('Run Playwright Tests') {
            steps {
                bat 'npx playwright test --workers=2 --retries=2'
            }
        }

        stage('Generate Allure Report') {
            steps {
                bat '''
                    if exist allure-report rmdir /s /q allure-report
                    allure generate allure-results --clean -o allure-report || exit 0
                '''
            }
        }

        stage('Archive Reports') {
            steps {
                junit 'reports/results.xml'
                archiveArtifacts artifacts: 'allure-results/**', fingerprint: true
                archiveArtifacts artifacts: 'playwright-report/**', fingerprint: true
                archiveArtifacts artifacts: 'allure-report/**', fingerprint: true
            }
        }

        stage('Publish Allure Report') {
            steps {
                allure includeProperties: false,
                       jdk: '',
                       results: [[path: 'allure-results']]
            }
        }
    }

    post {

        always {
            echo "🔍 Collecting test summary (from JUnit plugin)..."

            script {
                // Jenkins automatically stores JUnit numbers into environment variables
                env.TEST_TOTAL   = currentBuild.rawBuild.getAction(hudson.tasks.junit.TestResultAction)?.totalCount ?: "0"
                env.TEST_FAILED  = currentBuild.rawBuild.getAction(hudson.tasks.junit.TestResultAction)?.failCount ?: "0"
                env.TEST_SKIPPED = currentBuild.rawBuild.getAction(hudson.tasks.junit.TestResultAction)?.skipCount ?: "0"
                env.TEST_PASSED  = (env.TEST_TOTAL.toInteger() - env.TEST_FAILED.toInteger()).toString()
            }
        }

        success {
            echo "🎉 TESTS PASSED"

            emailext(
                to: 'sairaj@syslatech.com',
                subject: "Playwright CI — SUCCESS ✔ (${env.TEST_PASSED}/${env.TEST_TOTAL})",
                body: """
Hello Sai,

Your Playwright pipeline PASSED.

Test Summary
-------------------------
Total:  ${env.TEST_TOTAL}
Passed: ${env.TEST_PASSED}
Failed: ${env.TEST_FAILED}

Great job 👍

Regards,
Jenkins
                """,
                attachLog: true
            )
        }

        failure {
            echo "❌ TESTS FAILED"

            emailext(
                to: 'sairaj@syslatech.com',
                subject: "Playwright CI — FAILED ❌ (${env.TEST_FAILED} failed)",
                body: """
Hello Sai,

Your Playwright pipeline FAILED.

Test Summary
-------------------------
Total:  ${env.TEST_TOTAL}
Passed: ${env.TEST_PASSED}
Failed: ${env.TEST_FAILED}

Check Allure & Playwright HTML reports for details.

Regards,
Jenkins
                """,
                attachLog: true
            )
        }
    }
}
