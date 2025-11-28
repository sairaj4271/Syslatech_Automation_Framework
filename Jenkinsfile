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
                        echo "⚠️ Allure CLI not found, using Jenkins plugin"
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
                        echo "⚠️ JUnit report archiving failed: ${e.message}"
                    }
                    
                    archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true, fingerprint: true
                    archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true, fingerprint: true
                    archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true, fingerprint: true
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
                        echo "⚠️ Allure plugin publish failed: ${e.message}"
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
                echo "🎉 TESTS PASSED"
                
                emailext(
                    to: 'kandalsairaj4271@gmail.com',
                    from: 'kandalsairaj95@gmail.com',  // ✅ ADD THIS - Different sender
                    replyTo: 'kandalsairaj4271@gmail.com',
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

View Reports:
- Allure: ${env.BUILD_URL}allure
- HTML: ${env.BUILD_URL}artifact/playwright-report/index.html
- Console: ${env.BUILD_URL}console

Great job! 👍

---
Jenkins Automated Notification
                    """,
                    mimeType: 'text/plain',
                    attachLog: false
                )
                
                echo "✅ Email sent to: kandalsairaj4271@gmail.com"
            }
        }

        failure {
            script {
                echo "❌ TESTS FAILED"
                
                emailext(
                    to: 'kandalsairaj4271@gmail.com',
                    from: 'kandalsairaj95@gmail.com',  // ✅ ADD THIS
                    replyTo: 'kandalsairaj4271@gmail.com',
                    subject: "❌ Playwright CI — FAILED — Build #${env.BUILD_NUMBER}",
                    body: """
Hello Sai,

Your Playwright test pipeline FAILED ⚠️

Test Summary:
-------------
Total:   ${env.TEST_TOTAL}
Passed:  ${env.TEST_PASSED}
Failed:  ${env.TEST_FAILED}
Skipped: ${env.TEST_SKIPPED}

Build: #${env.BUILD_NUMBER}
Duration: ${env.BUILD_DURATION}

Investigation Steps:
1. Review Allure Report: ${env.BUILD_URL}allure
2. Check HTML Report: ${env.BUILD_URL}artifact/playwright-report/index.html
3. View Console: ${env.BUILD_URL}console

---
Jenkins Automated Notification
                    """,
                    mimeType: 'text/plain',
                    attachLog: true,
                    compressLog: true
                )
                
                echo "✅ Email sent to: kandalsairaj95@gmail.com"
            }
        }

        unstable {
            script {
                echo "⚠️ TESTS UNSTABLE"
                
                emailext(
                    to: 'kandalsairaj4271@gmail.com',
                    from: 'kandalsairaj95@gmail.com',  // ✅ ADD THIS
                    replyTo: 'kandalsairaj4271@gmail.com',
                    subject: "⚠️ Playwright CI — UNSTABLE (${env.TEST_FAILED}/${env.TEST_TOTAL} failed) — Build #${env.BUILD_NUMBER}",
                    body: """
Hello Sai,

Your Playwright test pipeline is UNSTABLE - some tests failed.

Test Summary:
-------------
Total:   ${env.TEST_TOTAL}
Passed:  ${env.TEST_PASSED}  ✅
Failed:  ${env.TEST_FAILED}  ❌
Skipped: ${env.TEST_SKIPPED}  ⏭️

Build: #${env.BUILD_NUMBER}
Duration: ${env.BUILD_DURATION}

Quick Links:
- Allure Report: ${env.BUILD_URL}allure
- Playwright Report: ${env.BUILD_URL}artifact/playwright-report/index.html
- Console Output: ${env.BUILD_URL}console
- Rebuild: ${env.BUILD_URL}rebuild

Please check the failed tests and fix them.

---
Jenkins Automated Notification
                    """,
                    mimeType: 'text/plain',
                    attachLog: false
                )
                
                echo "✅ Email sent to: kandalsairaj4271@gmail.com"
            }
        }
    }
}