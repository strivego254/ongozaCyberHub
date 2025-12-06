# Performance Testing Checklist

## Mission List Load Time (<300ms)
- [ ] Open missions page
- [ ] Measure time to first render
- [ ] Verify <300ms load time
- [ ] Test with 100+ missions
- [ ] Test with filters applied
- [ ] Test pagination performance

## AI Feedback Response Time (<5s)
- [ ] Submit a mission
- [ ] Measure time from submit to AI feedback display
- [ ] Verify <5s response time
- [ ] Test with various file sizes
- [ ] Test with multiple files

## File Upload Performance (<2s for 10MB)
- [ ] Upload 10MB file
- [ ] Measure upload time
- [ ] Verify <2s upload time
- [ ] Test chunked upload for large files
- [ ] Test progress indicator accuracy

## Mobile Lighthouse Score (95+)
- [ ] Run Lighthouse on mobile device
- [ ] Verify Performance score ≥ 95
- [ ] Check Core Web Vitals:
  - [ ] FCP < 1.8s
  - [ ] LCP < 2.5s
  - [ ] TTI < 3.8s
  - [ ] CLS < 0.1
  - [ ] TBT < 200ms

## Cache Performance
- [ ] Verify funnel data is cached (30s TTL)
- [ ] Test cache invalidation on submission
- [ ] Verify mission list uses cache
- [ ] Test cache hit rate

## Database Query Performance
- [ ] Verify indexes are used
- [ ] Check query execution time
- [ ] Test with large datasets (1000+ missions)
- [ ] Verify pagination doesn't slow down

