pipeline {
    agent any

    environment {
        PATH = "C:/Program Files/nodejs/;${env.PATH}"
        CI   = "true"
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
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                    bat 'npx playwright test --retries=2'
                }
            }
        }

        stage('Archive Reports') {
            steps {
                script {
                    try {
                        junit allowEmptyResults: true, testResults: 'reports/results.xml'
                    } catch (Exception e) {
                        echo "JUnit report failed: ${e.message}"
                    }

                    archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
                }
            }
        }

        stage('Publish Allure Report') {
            steps {
                script {
                    try {
                        allure includeProperties: false,
                               jdk: '',
                               results: [[path: 'allure-results']]
                    } catch (Exception e) {
                        echo "Allure publish failed: ${e.message}"
                    }
                }
            }
        }
    }

    post {

        always {
            script {
                echo "Collecting test summary..."

                def summary = junit(testResults: 'reports/results.xml', allowEmptyResults: true)

                env.TEST_TOTAL   = summary.totalCount?.toString() ?: "0"
                env.TEST_FAILED  = summary.failCount?.toString()  ?: "0"
                env.TEST_SKIPPED = summary.skipCount?.toString()  ?: "0"
                env.TEST_PASSED  = summary.passCount?.toString()  ?: "0"
                env.BUILD_STATUS = currentBuild.currentResult ?: "UNKNOWN"
                env.BUILD_DURATION = currentBuild.durationString.replace(' and counting', '')

                echo "Total: ${env.TEST_TOTAL}"
                echo "Passed: ${env.TEST_PASSED}"
                echo "Failed: ${env.TEST_FAILED}"
                echo "Skipped: ${env.TEST_SKIPPED}"
                echo "Status: ${env.BUILD_STATUS}"

                // ZIP PLAYWRIGHT REPORT using tar (Windows supported)
                echo "Creating playwright-report.zip..."

                bat '''
                    @echo off
                    if exist playwright-report (
                        tar -a -cf playwright-report.zip playwright-report
                        echo ZIP created
                    ) else (
                        echo No playwright-report found
                    )
                '''

                archiveArtifacts artifacts: 'playwright-report.zip', allowEmptyArchive: true
            }
        }

        // -----------------------
        // SUCCESS EMAIL
        // -----------------------
        success {
            script {
                withCredentials([usernamePassword(
                    credentialsId: 'gmail-app-password',
                    usernameVariable: 'SMTP_USER',
                    passwordVariable: 'SMTP_PASS'
                )]) {

                    emailext(
                        to: 'sairaj@syslatech.com',
                        from: "${SMTP_USER}",
                        subject: "SUCCESS — Playwright CI (#${env.BUILD_NUMBER})",
                        mimeType: "text/html",
                        body: generateEmailHtml("SUCCESS")
                    )
                }
            }
        }

        // -----------------------
        // FAILURE EMAIL
        // -----------------------
        failure {
            script {
                withCredentials([usernamePassword(
                    credentialsId: 'gmail-app-password',
                    usernameVariable: 'SMTP_USER',
                    passwordVariable: 'SMTP_PASS'
                )]) {

                    emailext(
                        to: 'sairaj@syslatech.com',
                        from: "${SMTP_USER}",
                        subject: "FAILED — Playwright CI (#${env.BUILD_NUMBER})",
                        mimeType: "text/html",
                        attachLog: true,
                        compressLog: true,
                        attachmentsPattern: 'playwright-report.zip, test-results/**/*.png',
                        body: generateEmailHtml("FAILED")
                    )
                }
            }
        }

        // -----------------------
        // UNSTABLE EMAIL
        // -----------------------
        unstable {
            script {
                withCredentials([usernamePassword(
                    credentialsId: 'gmail-app-password',
                    usernameVariable: 'SMTP_USER',
                    passwordVariable: 'SMTP_PASS'
                )]) {
                    emailext(
                        to: 'sairaj@syslatech.com',
                        from: "${SMTP_USER}",
                        subject: "UNSTABLE — Playwright CI (#${env.BUILD_NUMBER})",
                        mimeType: "text/html",
                        attachLog: true,
                        compressLog: true,
                        attachmentsPattern: 'playwright-report.zip',
                        body: generateEmailHtml("UNSTABLE")
                    )
                }
            }
        }
    }
}

// ----------------------------------------------------------
// HTML EMAIL TEMPLATE SHARED FUNCTION
// ----------------------------------------------------------
def generateEmailHtml(String status) {

    def color = [
        SUCCESS: "#1a9c33",
        FAILED: "#d52828",
        UNSTABLE: "#d58f00"
    ][status]

    return """
<html>
<head>
<style>
body { font-family: Arial; font-size:14px; }
h2 { color:${color}; }
table { border-collapse: collapse; width:100%; }
th,td { border:1px solid #ddd; padding:6px; }
th { background:#f4f4f4; }
</style>
</head>
<body>

<h2>Playwright Test Report — ${status}</h2>

<table>
<tr><th>Metric</th><th>Value</th></tr>
<tr><td>Build Status</td><td>${env.BUILD_STATUS}</td></tr>
<tr><td>Total Tests</td><td>${env.TEST_TOTAL}</td></tr>
<tr><td>Passed</td><td>${env.TEST_PASSED}</td></tr>
<tr><td>Failed</td><td>${env.TEST_FAILED}</td></tr>
<tr><td>Skipped</td><td>${env.TEST_SKIPPED}</td></tr>
<tr><td>Duration</td><td>${env.BUILD_DURATION}</td></tr>
</table>

<h3>Reports</h3>
<ul>
<li><a href="${env.BUILD_URL}artifact/playwright-report/index.html">HTML Report</a></li>
<li><a href="${env.BUILD_URL}allure">Allure Report</a></li>
<li><a href="${env.BUILD_URL}artifact">Artifacts</a></li>
<li><a href="${env.BUILD_URL}console">Console Log</a></li>
</ul>

</body>
</html>
"""
}
