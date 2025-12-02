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
                        subject: "SUCCESS — Build #${env.BUILD_NUMBER}",
                        body: "Playwright CI Success!"
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
                        subject: "FAILED — Build #${env.BUILD_NUMBER}",
                        body: "Playwright CI Failed!",
                        attachLog: true,
                        compressLog: true
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
                        subject: "UNSTABLE — Build #${env.BUILD_NUMBER}",
                        body: "Some tests failed."
                    )
                }
            }
        }
    }
}
