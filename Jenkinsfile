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

                    archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true
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
        always {
            script {

                echo "🔍 Collecting test summary..."

                def testResultSummary = junit(testResults: 'reports/results.xml', allowEmptyResults: true)

                env.TEST_TOTAL   = testResultSummary.totalCount?.toString()   ?: "0"
                env.TEST_FAILED  = testResultSummary.failCount?.toString()    ?: "0"
                env.TEST_SKIPPED = testResultSummary.skipCount?.toString()    ?: "0"
                env.TEST_PASSED  = testResultSummary.passCount?.toString()    ?: "0"
                env.BUILD_DURATION = currentBuild.durationString.replace(' and counting','')

                echo "📦 Creating Playwright ZIP file..."

                // ✔ FIX: Explicit PowerShell.exe path
                bat '''
                    powershell.exe -Command "Compress-Archive -Path \\"playwright-report\\*\\\\" -DestinationPath \\"playwright-report.zip\\" -Force"
                '''

                archiveArtifacts artifacts: 'playwright-report.zip', allowEmptyArchive: false
            }
        }

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
                        subject: "✅ SUCCESS — Playwright CI Build #${env.BUILD_NUMBER}",
                        body: """
<h2 style='color:green;'>Playwright CI — SUCCESS</h2>

<b>Build:</b> #${env.BUILD_NUMBER}<br>
<b>Duration:</b> ${env.BUILD_DURATION}<br><br>

<b>Results:</b><br>
Total:   ${env.TEST_TOTAL}<br>
Passed:  ${env.TEST_PASSED}<br>
Failed:  ${env.TEST_FAILED}<br>
Skipped: ${env.TEST_SKIPPED}<br><br>

<b>Reports:</b><br>
<a href="${env.BUILD_URL}allure">Allure Report</a><br>
<a href="${env.BUILD_URL}artifact/playwright-report/index.html">Playwright HTML Report</a><br>

---<br>
<i>Jenkins Automated Notification</i>
                        """,
                        mimeType: 'text/html',
                        attachmentsPattern: 'playwright-report.zip'
                    )
                }
            }
        }

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
                        subject: "❌ FAILED — Playwright CI Build #${env.BUILD_NUMBER}",
                        body: """
<h2 style='color:red;'>Playwright CI — FAILED</h2>

<b>Build:</b> #${env.BUILD_NUMBER}<br>
<b>Duration:</b> ${env.BUILD_DURATION}<br><br>

<b>Results:</b><br>
Total:   ${env.TEST_TOTAL}<br>
Passed:  ${env.TEST_PASSED}<br>
Failed:  ${env.TEST_FAILED}<br>
Skipped: ${env.TEST_SKIPPED}<br><br>

<b>Reports:</b><br>
<a href="${env.BUILD_URL}allure">Allure Report</a><br>
<a href="${env.BUILD_URL}artifact/playwright-report/index.html">Playwright HTML Report</a><br><br>

<b>Logs Attached.</b><br>
---<br>
<i>Jenkins Automated Notification</i>
                        """,
                        mimeType: 'text/html',
                        attachLog: true,
                        compressLog: true,
                        attachmentsPattern: 'playwright-report.zip'
                    )
                }
            }
        }

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
                        subject: "⚠️ UNSTABLE — Playwright CI Build #${env.BUILD_NUMBER}",
                        body: """
<h2 style='color:orange;'>Playwright CI — UNSTABLE</h2>

Some tests failed.<br><br>

<b>Results:</b><br>
Total:   ${env.TEST_TOTAL}<br>
Passed:  ${env.TEST_PASSED}<br>
Failed:  ${env.TEST_FAILED}<br>
Skipped: ${env.TEST_SKIPPED}<br><br>

<b>Reports:</b><br>
<a href="${env.BUILD_URL}allure">Allure Report</a><br>
<a href="${env.BUILD_URL}artifact/playwright-report/index.html">Playwright HTML Report</a><br><br>

<i>Jenkins Automated Notification</i>
                        """,
                        mimeType: 'text/html',
                        attachmentsPattern: 'playwright-report.zip'
                    )
                }
            }
        }
    }
}
