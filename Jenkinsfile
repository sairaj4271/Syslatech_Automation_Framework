pipeline {
    agent any

    environment {
        PATH = "C:/Program Files/nodejs/;${env.PATH}"
        CI   = "true"

        // ✔ MULTIPLE EMAIL RECIPIENTS (semicolon-separated)
        RECIPIENTS = "sairaj@syslatech.com;deepikadhar@syslatech.com"
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
                        echo "⚠ JUnit report archiving failed: ${e.message}"
                    }

                    archiveArtifacts artifacts: 'allure-results/**',     allowEmptyArchive: true
                    archiveArtifacts artifacts: 'playwright-report/**',  allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**',       allowEmptyArchive: true
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
                        echo "⚠ Allure plugin publish failed: ${e.message}"
                    }
                }
            }
        }
    }

    post {

        always {
            script {
                echo "📊 Collecting test summary..."

                def summary = junit(testResults: 'reports/results.xml', allowEmptyResults: true)

                env.TEST_TOTAL   = summary.totalCount?.toString() ?: "0"
                env.TEST_FAILED  = summary.failCount?.toString()  ?: "0"
                env.TEST_SKIPPED = summary.skipCount?.toString()  ?: "0"
                env.TEST_PASSED  = summary.passCount?.toString()  ?: "0"
                env.BUILD_DURATION = currentBuild.durationString.replace(' and counting', '')
                env.BUILD_STATUS   = currentBuild.currentResult ?: "UNKNOWN"

                echo "Total: ${env.TEST_TOTAL}"
                echo "Passed: ${env.TEST_PASSED}"
                echo "Failed: ${env.TEST_FAILED}"
                echo "Skipped: ${env.TEST_SKIPPED}"

                // Create ZIP without failing pipeline
                echo "📦 Creating ZIP..."

                try {
                    bat '''
                        @echo off
                        if exist playwright-report (
                            echo Creating zip...
                            tar -a -cf playwright-report.zip playwright-report
                        ) else (
                            echo No report folder found.
                        )
                    '''
                    archiveArtifacts artifacts: 'playwright-report.zip', allowEmptyArchive: true
                } catch (Exception e) {
                    echo "⚠ ZIP creation failed (ignored): ${e.message}"
                }
            }
        }

        // =====================================================================
        // SUCCESS EMAIL
        // =====================================================================
        success {
            script {
                withCredentials([usernamePassword(
                    credentialsId: 'gmail-app-password',
                    usernameVariable: 'SMTP_USER',
                    passwordVariable: 'SMTP_PASS'
                )]) {
                    emailext(
                        to: env.RECIPIENTS,
                        from: "${SMTP_USER}",
                        subject: "✅ Playwright CI — SUCCESS — Build #${env.BUILD_NUMBER}",
                        mimeType: "text/html",
                        body: generateHtmlEmail("SUCCESS")
                    )
                }
            }
        }

        // =====================================================================
        // FAILURE EMAIL
        // =====================================================================
        failure {
            script {
                withCredentials([usernamePassword(
                    credentialsId: 'gmail-app-password',
                    usernameVariable: 'SMTP_USER',
                    passwordVariable: 'SMTP_PASS'
                )]) {
                    emailext(
                        to: env.RECIPIENTS,
                        from: "${SMTP_USER}",
                        subject: "❌ Playwright CI — FAILED — Build #${env.BUILD_NUMBER}",
                        mimeType: "text/html",
                        attachLog: true,
                        compressLog: true,
                        attachmentsPattern: 'playwright-report.zip, test-results/**/*.png, test-results/**/*.zip',
                        body: generateHtmlEmail("FAILED")
                    )
                }
            }
        }

        // =====================================================================
        // UNSTABLE EMAIL
        // =====================================================================
        unstable {
            script {
                withCredentials([usernamePassword(
                    credentialsId: 'gmail-app-password',
                    usernameVariable: 'SMTP_USER",
                    passwordVariable: "SMTP_PASS"
                )]) {
                    emailext(
                        to: env.RECIPIENTS,
                        from: "${SMTP_USER}",
                        subject: "⚠️ Playwright CI — UNSTABLE — Build #${env.BUILD_NUMBER}",
                        mimeType: "text/html",
                        attachLog: true,
                        compressLog: true,
                        attachmentsPattern: 'playwright-report.zip',
                        body: generateHtmlEmail("UNSTABLE")
                    )
                }
            }
        }
    }
}

// ============================================================================
// HTML Email Template Generator
// ============================================================================
def generateHtmlEmail(String status) {

    def statusColor = [
        "SUCCESS":  "#1a9c33",
        "FAILED":   "#d52828",
        "UNSTABLE": "#d58f00"
    ][status]

    def title = [
        "SUCCESS":  "🎉 Playwright Test Execution — SUCCESS",
        "FAILED":   "❌ Playwright Test Execution — FAILED",
        "UNSTABLE": "⚠️ Playwright Test Execution — UNSTABLE"
    ][status]

    return """
<html>
<head>
<style>
  body { font-family: Arial; font-size: 14px; }
  h2 { color: ${statusColor}; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; }
  th { background: #f5f5f5; }
</style>
</head>
<body>

<h2>${title}</h2>

<h3>📊 Test Summary</h3>
<table>
<tr><th>Property</th><th>Value</th></tr>
<tr><td>Build Number</td><td>${env.BUILD_NUMBER}</td></tr>
<tr><td>Status</td><td>${env.BUILD_STATUS}</td></tr>
<tr><td>Total</td><td>${env.TEST_TOTAL}</td></tr>
<tr><td>Passed</td><td>${env.TEST_PASSED}</td></tr>
<tr><td>Failed</td><td>${env.TEST_FAILED}</td></tr>
<tr><td>Skipped</td><td>${env.TEST_SKIPPED}</td></tr>
<tr><td>Duration</td><td>${env.BUILD_DURATION}</td></tr>
<tr><td>Browser</td><td>chromium</td></tr>
</table>

<h3>📄 Reports</h3>
<ul>
<li><a href="${env.BUILD_URL}artifact/playwright-report/index.html">Playwright HTML Report</a></li>
<li><a href="${env.BUILD_URL}allure">Allure Report</a></li>
<li><a href="${env.BUILD_URL}artifact">Artifacts</a></li>
<li><a href="${env.BUILD_URL}console">Console Log</a></li>
</ul>

<p style="font-size:12px;color:#888;">Jenkins Automated Notification</p>

</body></html>
"""
}
