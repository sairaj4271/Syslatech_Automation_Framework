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
        /* same stages as your pipeline (unchanged) */
    }

    post {
        always {
            script {
                echo "🔍 Collecting test summary..."

                def testResultSummary = junit(testResults: 'reports/results.xml', allowEmptyResults: true)

                env.TEST_TOTAL = testResultSummary.totalCount?.toString() ?: "0"
                env.TEST_FAILED = testResultSummary.failCount?.toString() ?: "0"
                env.TEST_SKIPPED = testResultSummary.skipCount?.toString() ?: "0"
                env.TEST_PASSED = testResultSummary.passCount?.toString() ?: "0"
                env.BUILD_DURATION = currentBuild.durationString.replace(' and counting', '')

                echo "📊 Test Results:"
                echo "   Total: ${env.TEST_TOTAL}"
                echo "   Passed: ${env.TEST_PASSED}"
                echo "   Failed: ${env.TEST_FAILED}"
                echo "   Skipped: ${env.TEST_SKIPPED}"
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
                        subject: "✅ Playwright CI — SUCCESS — Build #${env.BUILD_NUMBER}",
                        body: """
Hello Sai,

Your Playwright test pipeline completed successfully! 🎉

Test Summary:
-------------
Total:   ${env.TEST_TOTAL}
Passed:  ${env.TEST_PASSED}
Failed:  ${env.TEST_FAILED}
Skipped: ${env.TEST_SKIPPED}

Build: #${env.BUILD_NUMBER}
Duration: ${env.BUILD_DURATION}

Reports:
- Allure: ${env.BUILD_URL}allure
- HTML: ${env.BUILD_URL}artifact/playwright-report/index.html
- Console: ${env.BUILD_URL}console

Great job! 👍

---
Jenkins Automated Notification
                        """,
                        mimeType: 'text/plain'
                    )
                }

                echo "✅ Email sent (SUCCESS)"
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
                        subject: "❌ Playwright CI — FAILED — Build #${env.BUILD_NUMBER}",
                        body: """
Hello ,

Your Playwright test pipeline FAILED ⚠️

Test Summary:
-------------
Total:   ${env.TEST_TOTAL}
Passed:  ${env.TEST_PASSED}
Failed:  ${env.TEST_FAILED}
Skipped: ${env.TEST_SKIPPED}

Check reports here:
- Allure Report: ${env.BUILD_URL}allure
- Playwright Report: ${env.BUILD_URL}artifact/playwright-report/index.html
- Console: ${env.BUILD_URL}console

---
Jenkins Automated Notification
                        """,
                        mimeType: 'text/plain',
                        attachLog: true,
                        compressLog: true
                    )
                }

                echo "📩 Email sent (FAILURE)"
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
                        subject: "⚠️ Playwright CI — UNSTABLE — Build #${env.BUILD_NUMBER}",
                        body: """
Hello Sai,

Your pipeline is UNSTABLE.

Test Summary:
-------------
Total:   ${env.TEST_TOTAL}
Passed:  ${env.TEST_PASSED}
Failed:  ${env.TEST_FAILED}
Skipped: ${env.TEST_SKIPPED}

Reports:
- Allure Report: ${env.BUILD_URL}allure
- HTML: ${env.BUILD_URL}artifact/playwright-report/index.html
- Console: ${env.BUILD_URL}console

---
Jenkins Automated Notification
                        """,
                        mimeType: 'text/plain'
                    )
                }

                echo "📩 Email sent (UNSTABLE)"
            }
        }
    }
}
