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

        /* -----------------------------------------------------------
           ALWAYS — Collect test summary
        ----------------------------------------------------------- */
        always {
            script {
                echo "🔍 Collecting test summary..."

                def testResultSummary = junit(testResults: 'reports/results.xml', allowEmptyResults: true)

                env.TEST_TOTAL   = testResultSummary.totalCount?.toString() ?: "0"
                env.TEST_FAILED  = testResultSummary.failCount?.toString()  ?: "0"
                env.TEST_SKIPPED = testResultSummary.skipCount?.toString() ?: "0"
                env.TEST_PASSED  = testResultSummary.passCount?.toString()  ?: "0"
                env.BUILD_DURATION = currentBuild.durationString.replace(' and counting', '')

                echo "📊 Test Results:"
                echo "   Total: ${env.TEST_TOTAL}"
                echo "   Passed: ${env.TEST_PASSED}"
                echo "   Failed: ${env.TEST_FAILED}"
                echo "   Skipped: ${env.TEST_SKIPPED}"
            }
        }

        /* -----------------------------------------------------------
           SUCCESS EMAIL — HTML TEMPLATE + ZIP ATTACHMENT
        ----------------------------------------------------------- */
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
                        replyTo: "${SMTP_USER}",
                        subject: "✔ SUCCESS — Playwright CI — Build #${env.BUILD_NUMBER}",
                        mimeType: "text/html",
                        attachmentsPattern: "playwright-report.zip",
                        body: """
<html>
<body style='font-family:Arial; font-size:14px;'>

<h2 style='color:green;'>Playwright Automation — SUCCESS</h2>

<table border='1' cellpadding='6' cellspacing='0'>
<tr style='background:#e6ffe6;'>
  <th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th>
</tr>
<tr>
  <td>${env.TEST_TOTAL}</td>
  <td style='color:green;'>${env.TEST_PASSED}</td>
  <td style='color:red;'>${env.TEST_FAILED}</td>
  <td>${env.TEST_SKIPPED}</td>
</tr>
</table>

<h3>Reports</h3>
<ul>
  <li><a href='${env.BUILD_URL}allure'>Allure Report</a></li>
  <li><a href='${env.BUILD_URL}artifact/playwright-report/index.html'>Playwright HTML Report</a></li>
  <li><a href='${env.BUILD_URL}console'>Console Output</a></li>
</ul>

<p>Build #: <b>${env.BUILD_NUMBER}</b></p>
<p>Duration: <b>${env.BUILD_DURATION}</b></p>

</body>
</html>
"""
                    )
                }
            }
        }

        /* -----------------------------------------------------------
           FAILURE EMAIL — HTML + LOG + SCREENSHOTS + TRACE
        ----------------------------------------------------------- */
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
                        replyTo: "${SMTP_USER}",
                        subject: "✘ FAILED — Playwright CI — Build #${env.BUILD_NUMBER}",
                        mimeType: "text/html",
                        attachLog: true,
                        compressLog: true,
                        attachmentsPattern: """
                            playwright-report.zip,
                            test-results/**/*.png,
                            test-results/**/*.zip
                        """,
                        body: """
<html>
<body style='font-family:Arial; font-size:14px;'>

<h2 style='color:red;'>Playwright Automation — FAILED</h2>

<table border='1' cellpadding='6' cellspacing='0'>
<tr style='background:#ffe6e6;'>
  <th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th>
</tr>
<tr>
  <td>${env.TEST_TOTAL}</td>
  <td style='color:green;'>${env.TEST_PASSED}</td>
  <td style='color:red; font-weight:bold;'>${env.TEST_FAILED}</td>
  <td>${env.TEST_SKIPPED}</td>
</tr>
</table>

<h3>Attached Debug Files</h3>
<ul>
 <li>Screenshots (PNG)</li>
 <li>Trace Files (ZIP)</li>
 <li>Playwright Report ZIP</li>
 <li>Console Log</li>
</ul>

<h3>Reports</h3>
<ul>
  <li><a href='${env.BUILD_URL}allure'>Allure Report</a></li>
  <li><a href='${env.BUILD_URL}artifact/playwright-report/index.html'>Playwright HTML Report</a></li>
  <li><a href='${env.BUILD_URL}console'>Console Output</a></li>
</ul>

</body>
</html>
"""
                    )
                }
            }
        }

        /* -----------------------------------------------------------
           UNSTABLE EMAIL — HTML + REPORT LINKS + ATTACHMENTS
        ----------------------------------------------------------- */
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
                        replyTo: "${SMTP_USER}",
                        subject: "⚠ UNSTABLE — Playwright CI — Build #${env.BUILD_NUMBER}",
                        mimeType: "text/html",
                        attachmentsPattern: """
                            playwright-report.zip,
                            test-results/**/*.png,
                            test-results/**/*.zip
                        """,
                        body: """
<html>
<body style='font-family:Arial; font-size:14px;'>

<h2 style='color:orange;'>Playwright Automation — UNSTABLE</h2>

<table border='1' cellpadding='6' cellspacing='0'>
<tr style='background:#fff4cc;'>
  <th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th>
</tr>
<tr>
  <td>${env.TEST_TOTAL}</td>
  <td>${env.TEST_PASSED}</td>
  <td style='color:red;'>${env.TEST_FAILED}</td>
  <td>${env.TEST_SKIPPED}</td>
</tr>
</table>

<h3>Reports</h3>
<ul>
  <li><a href='${env.BUILD_URL}allure'>Allure Report</a></li>
  <li><a href='${env.BUILD_URL}artifact/playwright-report/index.html'>Playwright HTML Report</a></li>
  <li><a href='${env.BUILD_URL}console'>Console Output</a></li>
</ul>

<p>Review failing tests.</p>

</body>
</html>
"""
                    )
                }
            }
        }
    }
}
