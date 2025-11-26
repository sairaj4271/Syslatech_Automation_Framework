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
                        echo "⚠️ Allure report generation failed: ${e.message}"
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
                    archiveArtifacts artifacts: 'allure-report/**', allowEmptyArchive: true, fingerprint: true
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
                
                // Safe way to get test results without getRawBuild()
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
                    to: 'kandalsairaj95@gmail.com',
                    subject: "✅ Playwright CI — SUCCESS — Build #${env.BUILD_NUMBER}",
                    body: """
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .summary { background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        a { color: #1976D2; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🎉 Playwright Test Pipeline - SUCCESS</h2>
    </div>
    <div class="content">
        <p>Hello Sai,</p>
        <p>Your Playwright test pipeline has <strong>completed successfully</strong>!</p>
        
        <div class="summary">
            <h3>📊 Test Summary</h3>
            <table>
                <tr><td><strong>Build Number:</strong></td><td>#${env.BUILD_NUMBER}</td></tr>
                <tr><td><strong>Duration:</strong></td><td>${env.BUILD_DURATION}</td></tr>
                <tr><td><strong>Total Tests:</strong></td><td>${env.TEST_TOTAL}</td></tr>
                <tr><td><strong>✅ Passed:</strong></td><td style="color: #4CAF50; font-weight: bold;">${env.TEST_PASSED}</td></tr>
                <tr><td><strong>❌ Failed:</strong></td><td style="color: #f44336; font-weight: bold;">${env.TEST_FAILED}</td></tr>
                <tr><td><strong>⏭️ Skipped:</strong></td><td>${env.TEST_SKIPPED}</td></tr>
            </table>
        </div>
        
        <p><strong>📈 View Reports:</strong></p>
        <ul>
            <li><a href="${env.BUILD_URL}allure">Allure Report</a></li>
            <li><a href="${env.BUILD_URL}artifact/playwright-report/index.html">Playwright HTML Report</a></li>
            <li><a href="${env.BUILD_URL}console">Console Output</a></li>
        </ul>
        
        <p>Excellent work! 👍</p>
    </div>
    <div class="footer">
        <p>Jenkins Automated Notification | ${new Date()}</p>
    </div>
</body>
</html>
                    """,
                    mimeType: 'text/html',
                    attachLog: false
                )
            }
        }

        failure {
            script {
                echo "❌ TESTS FAILED"
                
                emailext(
                    to: 'kandalsairaj95@gmail.com',
                    subject: "❌ Playwright CI — FAILED — Build #${env.BUILD_NUMBER}",
                    body: """
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .summary { background: #ffebee; padding: 15px; border-radius: 5px; border-left: 4px solid #f44336; margin: 20px 0; }
        .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        a { color: #1976D2; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <h2>❌ Playwright Test Pipeline - FAILED</h2>
    </div>
    <div class="content">
        <p>Hello Sai,</p>
        <p><strong>Your Playwright test pipeline has encountered failures.</strong></p>
        
        <div class="summary">
            <h3>📊 Test Summary</h3>
            <table>
                <tr><td><strong>Build Number:</strong></td><td>#${env.BUILD_NUMBER}</td></tr>
                <tr><td><strong>Duration:</strong></td><td>${env.BUILD_DURATION}</td></tr>
                <tr><td><strong>Total Tests:</strong></td><td>${env.TEST_TOTAL}</td></tr>
                <tr><td><strong>✅ Passed:</strong></td><td style="color: #4CAF50; font-weight: bold;">${env.TEST_PASSED}</td></tr>
                <tr><td><strong>❌ Failed:</strong></td><td style="color: #f44336; font-weight: bold;">${env.TEST_FAILED}</td></tr>
                <tr><td><strong>⏭️ Skipped:</strong></td><td>${env.TEST_SKIPPED}</td></tr>
            </table>
        </div>
        
        <p><strong>🔍 Investigation Steps:</strong></p>
        <ol>
            <li>Review the Allure Report for detailed test results</li>
            <li>Check Playwright HTML Report for screenshots and traces</li>
            <li>Analyze Console Output for error messages</li>
        </ol>
        
        <p><strong>📈 Quick Links:</strong></p>
        <ul>
            <li><a href="${env.BUILD_URL}allure">Allure Report</a></li>
            <li><a href="${env.BUILD_URL}artifact/playwright-report/index.html">Playwright HTML Report</a></li>
            <li><a href="${env.BUILD_URL}console">Console Output</a></li>
            <li><a href="${env.BUILD_URL}rebuild">🔄 Rebuild</a></li>
        </ul>
    </div>
    <div class="footer">
        <p>Jenkins Automated Notification | ${new Date()}</p>
    </div>
</body>
</html>
                    """,
                    mimeType: 'text/html',
                    attachLog: true,
                    compressLog: true
                )
            }
        }

        unstable {
            script {
                echo "⚠️ TESTS UNSTABLE"
                
                emailext(
                    to: 'kandalsairaj95@gmail.com',
                    subject: "⚠️ Playwright CI — UNSTABLE — Build #${env.BUILD_NUMBER}",
                    body: """
<html>
<body style="font-family: Arial, sans-serif;">
    <h2 style="color: #ff9800;">⚠️ Playwright Tests - UNSTABLE</h2>
    <p>Hello Sai,</p>
    <p>Some tests failed but the build continued.</p>
    
    <h3>Test Summary:</h3>
    <ul>
        <li>Build: #${env.BUILD_NUMBER}</li>
        <li>Duration: ${env.BUILD_DURATION}</li>
        <li>Total: ${env.TEST_TOTAL}</li>
        <li>Passed: ${env.TEST_PASSED}</li>
        <li>Failed: ${env.TEST_FAILED}</li>
    </ul>
    
    <p><a href="${env.BUILD_URL}">View Build Details</a></p>
</body>
</html>
                    """,
                    mimeType: 'text/html'
                )
            }
        }
    }
}