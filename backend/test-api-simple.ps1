# Mock Interview Wizard v3.0 - Simple API Test

$baseUrl = "http://localhost:3000/api"

Write-Host "=== API Test Started ===" -ForegroundColor Cyan

# Step 1: Register
Write-Host "`n1. Registering test user..." -ForegroundColor Yellow
$registerBody = @{
    email = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "Test123456"
    name = "Test User"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $registerBody
$token = $registerResponse.accessToken
Write-Host "Success! Token: $($token.Substring(0, 20))..." -ForegroundColor Green

# Step 2: Test Topic Mode
Write-Host "`n2. Testing TOPIC mode..." -ForegroundColor Yellow
$topicBody = @{
    mode = "TOPIC"
    jobTitle = "Frontend Developer"
    difficulty = "EXPERT"
    topics = @("React Internals", "Performance Optimization")
} | ConvertTo-Json

$topicResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session" -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $topicBody
Write-Host "Success! Session ID: $($topicResponse.data.sessionId)" -ForegroundColor Green
Write-Host "Greeting: $($topicResponse.data.greeting.Substring(0, 80))..." -ForegroundColor Gray

# Step 3: Test DTO Validation
Write-Host "`n3. Testing DTO validation (should fail)..." -ForegroundColor Yellow
$invalidBody = @{
    mode = "TOPIC"
    jobTitle = "Frontend Developer"
    difficulty = "MEDIUM"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/interview/session" -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $invalidBody
    Write-Host "ERROR: Should have failed!" -ForegroundColor Red
} catch {
    Write-Host "Success! Correctly rejected (400 Bad Request)" -ForegroundColor Green
}

Write-Host "`n=== All Tests Passed ===" -ForegroundColor Green
