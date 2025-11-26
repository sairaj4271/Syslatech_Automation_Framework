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
                bat 'npx playwright test --retries=2'
            }
        }

        stage('Generate Allure Report') {
            steps {
                bat '''
                    if exist allure-report rmdir /s /q allure-report
                    allure generate allure-results --clean -o allure-report
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
            echo "🔍 Collecting test summary..."
            script {
                def testResultAction = currentBuild.rawBuild.getAction(hudson.tasks.junit.TestResultAction)
                
                env.TEST_TOTAL   = testResultAction?.totalCount?.toString() ?: "0"
                env.TEST_FAILED  = testResultAction?.failCount?.toString() ?: "0"
                env.TEST_SKIPPED = testResultAction?.skipCount?.toString() ?: "0"
                env.TEST_PASSED  = (env.TEST_TOTAL.toInteger() - env.TEST_FAILED.toInteger()).toString()
            }
        }

        success {
            echo "🎉 TESTS PASSED"
            emailext(
                to: 'sairaj@syslatech.com',
                subject: "✅ Playwright CI — SUCCESS (${env.TEST_PASSED}/${env.TEST_TOTAL})",
                body: """
Hello Sai,

Your Playwright pipeline PASSED successfully! 🎉

Test Summary
-------------------------
Total:  ${env.TEST_TOTAL}
Passed: ${env.TEST_PASSED}
Failed: ${env.TEST_FAILED}

View Reports:
- Allure: ${env.BUILD_URL}allure
- HTML: ${env.BUILD_URL}artifact/playwright-report/index.html

Great job! 👍

Regards,
Jenkins
                """,
                attachLog: false
            )
        }

        failure {
            echo "❌ TESTS FAILED"
            emailext(
                to: 'sairaj@syslatech.com',
                subject: "❌ Playwright CI — FAILED (${env.TEST_FAILED} failures)",
                body: """
Hello Sai,

Your Playwright pipeline FAILED ⚠️

Test Summary
-------------------------
Total:  ${env.TEST_TOTAL}
Passed: ${env.TEST_PASSED}
Failed: ${env.TEST_FAILED}

Investigation Links:
- Allure Report: ${env.BUILD_URL}allure
- HTML Report: ${env.BUILD_URL}artifact/playwright-report/index.html
- Console: ${env.BUILD_URL}console

Please check the reports for details.

Regards,
Jenkins
                """,
                attachLog: true
            )
        }
    }
}