pipeline {

    agent any

    environment {
        PATH = "C:/Program Files/nodejs/;${env.PATH}"
        CI   = "true"

        // ===========================================
        // 🔵 Default Environment: QA
        // Options → DEV / QA / PROD
        // ===========================================
        ENVIRONMENT = "QA"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 40, unit: 'MINUTES')
    }

    // ================================================================
    // RECIPIENT RESOLVER FUNCTION — Environment Based Email Routing
    // ================================================================
    def getRecipients = { envName ->
        switch(envName.toUpperCase()) {

            case "DEV":
                return "sairaj@syslatech.com"

            case "QA":
                return "sairaj@syslatech.com, deepikadhar@syslatech.com"

            case "PROD":
                return """
                    sairaj@syslatech.com,
                    deepikadhar@syslatech.com,
                    ravi.k@syslatech.com,
                    chandu.prasad@syslatech.com
                """.replaceAll("\\s","")

            default:
                return "sairaj@syslatech.com"
        }
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/sairaj4271/Syslatech_Playwright.git'
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

        stage('Generate Allure Report CLI (if installed)') {
            steps {
                script {
                    try {
                        bat '''
                            if exist allure-report rmdir /s /q allure-report
                            allure generate allure-results --clean -o allure-report
                        '''
                    } catch (Exception e) {
                        echo "⚠ Allure CLI not found, using Jenkins plugin"
                    }
                }
            }
        }

        stage('Archive Reports') {
            steps {
                script {
                    try {
                        junit allowEmptyResults: true, testResults: 'reports/results.xml'
                    } catch (Exception e) {
                        echo "⚠ JUnit XML missing or invalid"
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
                        allure includeProperties: false, jdk: '', results: [[path: 'allure-results']]
                    } catch (Exception e) {
                        echo "⚠ Allure plugin publish failed"
                    }
                }
            }
        }
    }

    post {

        // ============================================================================
        // ALWAYS — Collect Test Summary + Create ZIP
        // ============================================================================
        always {
            script {

                echo "🔍 Collecting test summary..."

                def testResultSummary = junit(testResults: 'reports/results.xml', allowEmptyResults: true)

                env.TEST_TOTAL   = testResultSummary.totalCount?.toString() ?: "0"
                env.TEST_PASSED  = testResultSummary.passCount?.toString()  ?: "0"
                env.TEST_FAILED  = testResultSummary.failCount?.toString()  ?: "0"
                env.TEST_SKIPPED = testResultSummary.skipCount?.toString()  ?: "0"
                env.BUILD_STATUS = currentBuild.currentResult ?: "UNKNOWN"
                env.BUILD_DURATION = currentBuild.durationString.replace(' and counting', '')

                echo "📊 Summary → Total:${env.TEST_TOTAL}, Passed:${env.TEST_PASSED}, Failed:${env.TEST_FAILED}"

                echo "📦 Creating Playwright ZIP (best-effort)..."

                int zipStatus = bat(
                    script: '''
                        @echo off
                        if not exist "playwright-report" exit /b 0
                        where powershell.exe >nul 2>nul || exit /b 0

                        powershell.exe -Command "Compress-Archive -Path 'playwright-report\\*' -DestinationPath 'playwright-report.zip' -Force"
                    ''',
                    returnStatus: true
                )

                if (zipStatus == 0) {
                    echo "✅ ZIP created"
                } else {
                    echo "⚠ ZIP skipped (PowerShell missing)"
                }

                archiveArtifacts artifacts: 'playwright-report.zip', allowEmptyArchive: true
            }
        }

        // ============================================================================
        // SUCCESS EMAIL
        // ============================================================================
        success {
            script {

                def recipients = getRecipients(env.ENVIRONMENT)

                withCredentials([usernamePassword(
                    credentialsId: 'gmail-app-password',
                    usernameVariable: 'SMTP_USER',
                    passwordVariable: 'SMTP_PASS'
                )]) {

                    emailext(
                        to: recipients,
                        from: "${SMTP_USER}",
                        subject: "✅ Playwright CI — SUCCESS — Build #${env.BUILD_NUMBER} (${env.ENVIRONMENT})",
                        mimeType: 'text/html',
                        body: """
                        <html><body>
                        <h2 style='color:#1a9c33'>Playwright Test Execution Report — SUCCESS</h2>
                        <p><b>Environment:</b> ${env.ENVIRONMENT}</p>

                        <h3>Summary</h3>
                        <table border='1' cellpadding='6' cellspacing='0'>
                            <tr><td><b>Total</b></td><td>${env.TEST_TOTAL}</td></tr>
                            <tr><td><b>Passed</b></td><td>${env.TEST_PASSED}</td></tr>
                            <tr><td><b>Failed</b></td><td>${env.TEST_FAILED}</td></tr>
                            <tr><td><b>Skipped</b></td><td>${env.TEST_SKIPPED}</td></tr>
                            <tr><td><b>Duration</b></td><td>${env.BUILD_DURATION}</td></tr>
                        </table>

                        <h3>View Reports</h3>
                        <ul>
                            <li><a href="${env.BUILD_URL}artifact/playwright-report/index.html">HTML Report</a></li>
                            <li><a href="${env.BUILD_URL}allure">Allure Report</a></li>
                            <li><a href="${env.BUILD_URL}artifact">Artifacts</a></li>
                            <li><a href="${env.BUILD_URL}console">Console Log</a></li>
                        </ul>
                        </body></html>
                        """
                    )
                }
            }
        }

        // ============================================================================
        // FAILURE EMAIL
        // ============================================================================
        failure {
            script {

                def recipients = getRecipients(env.ENVIRONMENT)

                withCredentials([usernamePassword(
                    credentialsId: 'gmail-app-password',
                    usernameVariable: 'SMTP_USER',
                    passwordVariable: 'SMTP_PASS'
                )]) {

                    emailext(
                        to: recipients,
                        from: "${SMTP_USER}",
                        subject: "❌ Playwright CI — FAILED — Build #${env.BUILD_NUMBER} (${env.ENVIRONMENT})",
                        mimeType: 'text/html',
                        attachLog: true,
                        compressLog: true,
                        attachmentsPattern: 'playwright-report.zip, test-results/**/*.png, test-results/**/*.zip',
                        body: """
                        <html><body>
                        <h2 style='color:#d52828'>Playwright Test Execution Report — FAILED</h2>
                        <p><b>Environment:</b> ${env.ENVIRONMENT}</p>

                        <h3>Summary</h3>
                        <table border='1' cellpadding='6' cellspacing='0'>
                            <tr><td><b>Total</b></td><td>${env.TEST_TOTAL}</td></tr>
                            <tr><td><b>Passed</b></td><td>${env.TEST_PASSED}</td></tr>
                            <tr><td><b>Failed</b></td><td>${env.TEST_FAILED}</td></tr>
                            <tr><td><b>Skipped</b></td><td>${env.TEST_SKIPPED}</td></tr>
                        </table>

                        <h3>Quick Links</h3>
                        <ul>
                            <li><a href="${env.BUILD_URL}allure">Allure Report</a></li>
                            <li><a href="${env.BUILD_URL}artifact/playwright-report/index.html">HTML Report</a></li>
                            <li><a href="${env.BUILD_URL}artifact">Screenshots / Traces</a></li>
                            <li><a href="${env.BUILD_URL}console">Console Log</a></li>
                        </ul>
                        </body></html>
                        """
                    )
                }
            }
        }

        // ============================================================================
        // UNSTABLE EMAIL
        // ============================================================================
        unstable {
            script {

                def recipients = getRecipients(env.ENVIRONMENT)

                withCredentials([usernamePassword(
                    credentialsId: 'gmail-app-password',
                    usernameVariable: 'SMTP_USER',
                    passwordVariable: 'SMTP_PASS'
                )]) {

                    emailext(
                        to: recipients,
                        from: "${SMTP_USER}",
                        subject: "⚠️ Playwright CI — UNSTABLE — Build #${env.BUILD_NUMBER} (${env.ENVIRONMENT})",
                        mimeType: 'text/html',
                        attachLog: true,
                        compressLog: true,
                        attachmentsPattern: 'playwright-report.zip',
                        body: """
                        <html><body>
                        <h2 style='color:#d58f00'>Playwright Test Execution Report — UNSTABLE</h2>
                        <p><b>Environment:</b> ${env.ENVIRONMENT}</p>

                        <h3>Summary</h3>
                        <table border='1' cellpadding='6' cellspacing='0'>
                            <tr><td><b>Total</b></td><td>${env.TEST_TOTAL}</td></tr>
                            <tr><td><b>Passed</b></td><td>${env.TEST_PASSED}</td></tr>
                            <tr><td><b>Failed</b></td><td>${env.TEST_FAILED}</td></tr>
                            <tr><td><b>Skipped</b></td><td>${env.TEST_SKIPPED}</td></tr>
                        </table>

                        <h3>Reports</h3>
                        <ul>
                            <li><a href="${env.BUILD_URL}allure">Allure Report</a></li>
                            <li><a href="${env.BUILD_URL}artifact/playwright-report/index.html">HTML Report</a></li>
                            <li><a href="${env.BUILD_URL}console">Console Log</a></li>
                        </ul>
                        </body></html>
                        """
                    )
                }
            }
        }
    }
}
