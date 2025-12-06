# Mission Testing Scripts

## Mobile Camera Upload Testing

### Manual Testing on iOS
1. Open Safari on iPhone/iPad
2. Navigate to `/dashboard/student/missions`
3. Open a mission
4. Tap "Camera" button
5. Grant camera permission
6. Take a photo
7. Verify upload progress and success

### Manual Testing on Android
1. Open Chrome on Android device
2. Navigate to `/dashboard/student/missions`
3. Open a mission
4. Tap "Camera" button
5. Grant camera permission
6. Take a photo
7. Verify upload progress and success

### Automated Testing
```bash
# Run mobile upload tests
npm run test:mobile-upload

# Or use the test script
./scripts/test-mobile-upload.sh
```

## Lighthouse Performance Testing

### Run Lighthouse Test
```bash
# Set test URL (default: http://localhost:3000/dashboard/student/missions)
export TEST_URL=http://localhost:3000/dashboard/student/missions

# Run Lighthouse test
npm run lighthouse:missions

# Or run directly
node scripts/lighthouse-test.js
```

### Performance Targets
- Performance Score: **95+** (Mobile)
- Mission List Load: **<300ms**
- First Contentful Paint: **<1.8s**
- Largest Contentful Paint: **<2.5s**
- Time to Interactive: **<3.8s**

### Expected Results
The script will output:
- Performance score
- Key metrics (FCP, LCP, TTI, etc.)
- Performance opportunities
- Mission-specific metrics
- Pass/Fail status

