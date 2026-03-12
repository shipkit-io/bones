---
description:
globs:
alwaysApply: false
---
# Payment Provider Integration Best Practices

## Field Consistency and Data Mapping

### Database Field Usage
- **ALWAYS** store order IDs in both `orderId` and `processorOrderId` fields during import for maximum compatibility
- **NEVER** assume a single field will contain the data - different providers may use different conventions
- Use consistent field naming patterns across all providers in [src/server/providers/](mdc:src/server/providers)

### Provider Import Methods
When implementing `importPayments()` in provider classes:
```typescript
// ✅ CORRECT: Store in both fields
await db.insert(payments).values({
  orderId: processorOrderId,           // For display compatibility
  processorOrderId: processorOrderId,  // For provider-specific operations
  // ... other fields
});

// ❌ WRONG: Only storing in one field
await db.insert(payments).values({
  processorOrderId: processorOrderId,  // Missing orderId for display
  // ... other fields
});
```

### Service Layer Display Logic
In [src/server/services/payment-service.ts](mdc:src/server/services/payment-service.ts), always implement fallback logic:
```typescript
// ✅ CORRECT: Fallback logic
orderId: payment.orderId || payment.processorOrderId || "",

// ❌ WRONG: Single field dependency
orderId: payment.orderId ?? "",
```

## Provider Integration Patterns

### Required Provider Methods
Every payment provider must implement consistent data mapping:
- `getAllOrders()` - Must include proper order ID mapping
- `getOrdersByEmail()` - Must use same mapping as getAllOrders
- `importPayments()` - Must store data in compatible database fields
- `handleWebhookEvent()` - Must use consistent field mapping

### Data Validation
- **ALWAYS** validate that imported data contains expected fields
- **ALWAYS** test the complete data flow: Provider API → Import → Database → Service → UI
- **NEVER** assume provider APIs return data in expected formats

### Error Handling
- Log detailed information when field mapping fails
- Provide meaningful fallback values for missing data
- Document which fields are required vs optional for each provider

## Testing Requirements

### Integration Testing
- Test complete data flow from provider import to admin UI display
- Verify all database fields are populated correctly
- Test with real provider data, not just mock data
- Validate backward compatibility with existing payment data

### Field Mapping Verification
Create debug scripts to verify field mapping:
```typescript
// Example: debug-{provider}-import-test.ts
const importStats = await provider.importPayments();
const payments = await PaymentService.getUsersWithPayments();
// Verify orderId is populated in UI data
```

## Common Anti-Patterns

### ❌ Field Mapping Mistakes
- Storing order IDs only in provider-specific fields
- Reading from single fields without fallbacks
- Inconsistent field usage across providers
- Not testing complete data flow

### ❌ Provider Implementation Issues
- Missing product name extraction during import
- Inconsistent error handling across providers
- Not storing metadata for debugging
- Missing webhook signature verification

### ❌ Service Layer Problems
- Hard-coding field names without fallbacks
- Not handling missing or null values
- Inconsistent data transformation
- Missing validation of provider data

## Documentation Requirements

### Provider Documentation
- Document which database fields each provider populates
- Explain field mapping rationale and fallback logic
- Include examples of successful imports
- Document known limitations or edge cases

### Database Schema Documentation
- Explain purpose of both `orderId` and `processorOrderId` fields
- Document which providers use which fields
- Explain fallback logic in service layer
- Keep migration notes for field changes

## Validation Checklist

Before deploying provider changes:
- [ ] Import stores data in compatible database fields
- [ ] Service layer includes fallback logic for display
- [ ] Admin UI shows correct data for all providers
- [ ] Backward compatibility maintained
- [ ] Debug scripts created and tested
- [ ] Documentation updated
- [ ] Integration tests pass

## Reference Implementation

See [src/server/providers/polar-provider.ts](mdc:src/server/providers/polar-provider.ts) lines 290-295 for correct field mapping during import.

See [src/server/services/payment-service.ts](mdc:src/server/services/payment-service.ts) line 909 for correct fallback logic in service layer.

## Lessons from Polar Integration

The Polar payment integration revealed critical field mapping issues:
- Product names extracted correctly but order IDs missing in UI
- Root cause: Field stored in `processorOrderId` but UI read from `orderId`
- Solution: Store in both fields + add fallback logic
- Result: Backward compatible fix that works for all providers

This pattern should be applied to all future provider integrations to ensure data consistency and proper UI display.
