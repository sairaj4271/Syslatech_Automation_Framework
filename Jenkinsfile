pipeline {
    agent any

    environment {
        PATH = "C:/Program Files/nodejs/;${env.PATH}"
        CI = "true"
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

        stage('Generate Allure Report') {
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
                        echo "⚠ JUnit report archiving failed: ${e.message}"
                    }

                    archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'playwright-report.zip', allowEmptyArchive: true
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
                echo "🔍 Collecting test summary..."

                def result = junit(testResults: 'reports/results.xml', allowEmptyResults: true)

                env.TEST_TOTAL = result.totalCount?.toString() ?: "0"
                env.TEST_FAILED = result.failCount?.toString() ?: "0"
                env.TEST_SKIPPED = result.skipCount?.toString() ?: "0"
                env.TEST_PASSED = result.passCount?.toString() ?: "0"
                env.BUILD_DURATION = currentBuild.durationString.replace(' and counting', '')

                echo "📊 Test Results:"
                echo "Total: ${env.TEST_TOTAL}"
                echo "Passed: ${env.TEST_PASSED}"
                echo "Failed: ${env.TEST_FAILED}"
                echo "Skipped: ${env.TEST_SKIPPED}"

                // Create Playwright Report ZIP
                bat 'powershell Compress-Archive -Path playwright-report\\* -DestinationPath playwright-report.zip -Force'
            }
        }


        // -------------------------------------------------------
        // SUCCESS EMAIL
        // -------------------------------------------------------
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
                        subject: "✅ SUCCESS — Playwright CI — Build #${env.BUILD_NUMBER}",
                        mimeType: 'text/html',
                        body: """
<html><body style="font-family:Arial; font-size:14px;">
<h2 style="color:green;">Playwright Automation - SUCCESS</h2>

<b>Build #${env.BUILD_NUMBER}</b><br>
Duration: ${env.BUILD_DURATION}<br><br>

<table border="1" cellpadding="6">
<tr><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th></tr>
<tr>
<td>${env.TEST_TOTAL}</td>
<td>${env.TEST_PASSED}</td>
<td>${env.TEST_FAILED}</td>
<td>${env.TEST_SKIPPED}</td>
</tr>
</table>

<h3>Reports</h3>
<ul>
<li><a href="${env.BUILD_URL}allure">Allure Report</a></li>
<li><a href="${env.BUILD_URL}artifact/playwright-report/index.html">Playwright HTML Report</a></li>
<li><a href="${env.BUILD_URL}console">Console Output</a></li>
</ul>

</body></html>
                        """
                    )
                }
            }
        }


        // -------------------------------------------------------
        // FAILURE EMAIL
        // -------------------------------------------------------
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
                        subject: "❌ FAILED — Playwright CI — Build #${env.BUILD_NUMBER}",
                        mimeType: 'text/html',
                        attachLog: true,
                        compressLog: true,
                        attachmentsPattern: "playwright-report.zip, test-results/**/*.png, test-results/**/*.zip",
                        body: """
<html><body style="font-family:Arial;">

<h2 style="color:red;">Playwright Automation - FAILURE</h2>

<b>Build #${env.BUILD_NUMBER}</b><br>
Duration: ${env.BUILD_DURATION}<br><br>

<table border="1" cellpadding="6">
<tr><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th></tr>
<tr>
<td>${env.TEST_TOTAL}</td>
<td>${env.TEST_PASSED}</td>
<td style="color:red;">${env.TEST_FAILED}</td>
<td>${env.TEST_SKIPPED}</td>
</tr>
</table>

<h3>Reports</h3>
<ul>
<li><a href="${env.BUILD_URL}allure">Allure Report</a></li>
<li><a href="${env.BUILD_URL}artifact/playwright-report/index.html">Playwright Report</a></li>
<li><a href="${env.BUILD_URL}console">Console Output</a></li>
</ul>

<h3>Attachments</h3>
<ul>
<li>Playwright Report ZIP</li>
<li>Screenshots (*.png)</li>
<li>Traces (*.zip)</li>
</ul>

</body></html>
                        """
                    )
                }
            }
        }


        // -------------------------------------------------------
        // UNSTABLE EMAIL (Some tests failed)
        // -------------------------------------------------------
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
                        subject: "⚠️ UNSTABLE — Playwright CI — Build #${env.BUILD_NUMBER}",
                        mimeType: 'text/html',
                        attachmentsPattern: "playwright-report.zip, test-results/**/*.png, test-results/**/*.zip",
                        body: """
<html><body style="font-family:Arial;">

<h2 style="color:orange;">Playwright Automation - UNSTABLE</h2>

<b>Build #${env.BUILD_NUMBER}</b><br>
Duration: ${env.BUILD_DURATION}<br><br>

<table border="1" cellpadding="6">
<tr><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th></tr>
<tr>
<td>${env.TEST_TOTAL}</td>
<td>${env.TEST_PASSED}</td>
<td style="color:red;">${env.TEST_FAILED}</td>
<td>${env.TEST_SKIPPED}</td>
</tr>
</table>

<h3>Reports</h3>
<ul>
<li><a href="${env.BUILD_URL}allure">Allure Report</a></li>
<li><a href="${env.BUILD_URL}artifact/playwright-report/index.html">Playwright Report</a></li>
<li><a href="${env.BUILD_URL}console">Console Output</a></li>
</ul>

<h3>Attachments</h3>
<ul>
<li>Playwright Report ZIP</li>
<li>Screenshots (*.png)</li>
<li>Traces (*.zip)</li>
</ul>

</body></html>
                        """
                    )
                }
            }
        }

    }
}
