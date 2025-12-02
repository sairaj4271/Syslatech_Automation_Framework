post {
    always {
        script {
            echo "Collecting test summary..."

            def testResultSummary = junit(testResults: 'reports/results.xml', allowEmptyResults: true)

            env.TEST_TOTAL   = testResultSummary.totalCount?.toString() ?: "0"
            env.TEST_FAILED  = testResultSummary.failCount?.toString() ?: "0"
            env.TEST_SKIPPED = testResultSummary.skipCount?.toString() ?: "0"
            env.TEST_PASSED  = testResultSummary.passCount?.toString() ?: "0"
            env.BUILD_DURATION = currentBuild.durationString.replace(' and counting', '')

            echo "Test Results:"
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
                    subject: "Playwright CI - SUCCESS - Build #${env.BUILD_NUMBER}",
                    body: """
Hello Sai,

Your Playwright pipeline completed successfully.

Test Summary:
-------------
Total:   ${env.TEST_TOTAL}
Passed:  ${env.TEST_PASSED}
Failed:  ${env.TEST_FAILED}
Skipped: ${env.TEST_SKIPPED}

Reports:
- Allure Report: ${env.BUILD_URL}allure
- HTML Report: ${env.BUILD_URL}artifact/playwright-report/index.html
- Console Output: ${env.BUILD_URL}console

Regards,
Jenkins Notification
                    """,
                    mimeType: 'text/plain'
                )
            }
            
            echo "Email sent (SUCCESS)"
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
                    subject: "Playwright CI - FAILURE - Build #${env.BUILD_NUMBER}",
                    body: """
Hello,

Your Playwright pipeline failed.

Test Summary:
-------------
Total:   ${env.TEST_TOTAL}
Passed:  ${env.TEST_PASSED}
Failed:  ${env.TEST_FAILED}
Skipped: ${env.TEST_SKIPPED}

Reports:
- Allure Report: ${env.BUILD_URL}allure
- Playwright HTML Report: ${env.BUILD_URL}artifact/playwright-report/index.html
- Console Output: ${env.BUILD_URL}console

Regards,
Jenkins Notification
                    """,
                    mimeType: 'text/plain',
                    attachLog: true,
                    compressLog: true
                )
            }

            echo "Email sent (FAILURE)"
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
                    subject: "Playwright CI - UNSTABLE - Build #${env.BUILD_NUMBER}",
                    body: """
Hello Sai,

Your Playwright pipeline is unstable.

Test Summary:
-------------
Total:   ${env.TEST_TOTAL}
Passed:  ${env.TEST_PASSED}
Failed:  ${env.TEST_FAILED}
Skipped: ${env.TEST_SKIPPED}

Reports:
- Allure Report: ${env.BUILD_URL}allure
- Playwright HTML Report: ${env.BUILD_URL}artifact/playwright-report/index.html
- Console Output: ${env.BUILD_URL}console

Regards,
Jenkins Notification
                    """,
                    mimeType: 'text/plain'
                )
            }

            echo "Email sent (UNSTABLE)"
        }
    }
}
