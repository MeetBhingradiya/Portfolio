# Payment Overdue Management System

This system automatically handles overdue payments for your clients across Android apps, backend services, and frontend applications.

## Features

- **Automatic overdue detection** after 45 days (configurable)
- **Client-specific actions** for different platforms:
  - **Android**: Crash app and redirect to payment page
  - **Backend**: Return error responses or limit access
  - **Frontend**: Redirect to payment page or show overlay
- **Payment tracking** and history
- **Automated middleware** protection for API routes

## Setup

### 1. Database Schema
The `Applications` model has been updated with overdue management fields:
- `PaymentDueDate`: When payment is due
- `IsOverdue`: Current overdue status
- `OverdueGracePeriodDays`: Grace period (default 45 days)
- `OverdueActions`: Actions for each client type

### 2. API Endpoints

#### Check Overdue Status
```
GET /api/payment/overdue?applicationId=YOUR_APP_ID&clientType=Android|Backend|Frontend
```

#### Record Payment
```
POST /api/payment/overdue
Content-Type: application/json

{
  "applicationId": "YOUR_APP_ID",
  "amount": 1000,
  "currency": "INR",
  "paymentMethod": "UPI",
  "status": "Completed"
}
```

## Usage Examples

### Android App Integration
```kotlin
// Check payment status on app startup
fun checkPaymentStatus() {
    val url = "https://yourapi.com/api/payment/overdue?applicationId=$APP_ID&clientType=Android"
    
    // Make HTTP request
    val response = httpClient.get(url)
    
    if (response.status == 402) { // Payment Required
        val data = response.json()
        
        if (data.shouldCrash) {
            // Force crash and redirect
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(data.redirectUrl))
            startActivity(intent)
            throw RuntimeException(data.errorMessage)
        }
        
        if (data.shouldRedirect) {
            // Redirect to payment page
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(data.redirectUrl))
            startActivity(intent)
            finish()
        }
    }
}
```

### Backend API Protection
```typescript
// Protect your API routes
import { withPaymentCheck, getApplicationIdFromHeaders } from './Middleware/PaymentMiddleware';

async function yourApiHandler(request: NextRequest) {
    // Your API logic here
    return NextResponse.json({ data: "success" });
}

// Wrap with payment protection
export const GET = withPaymentCheck(
    yourApiHandler,
    getApplicationIdFromHeaders,
    "Backend"
);
```

### Frontend JavaScript Integration
```javascript
// Check payment status before loading sensitive content
async function checkPaymentStatus() {
    const response = await fetch(
        `/api/payment/overdue?applicationId=${APP_ID}&clientType=Frontend`
    );
    
    if (response.status === 402) {
        const data = await response.json();
        
        if (data.action.redirect) {
            // Redirect to payment page
            window.location.href = data.action.redirectUrl;
            return;
        }
        
        if (data.action.overlay) {
            // Show payment overlay
            showPaymentOverlay(data.message, data.action.paymentUrl);
            return;
        }
    }
    
    // Payment is up to date, load content normally
    loadMainContent();
}
```

## Client Integration Headers

All your clients should include the Application ID in requests:

```
X-Application-ID: your-application-id
```

## Configuration

### Set Overdue Actions
```javascript
// Configure what happens when payment is overdue
const application = await Applications_Model.findOne({ ApplicationID: "your-app-id" });

application.OverdueActions = {
    Android: {
        enabled: true,
        action: "crash", // "crash", "redirect", "disable"
        redirectUrl: "https://yourwebsite.com/payment-overdue",
        errorMessage: "Payment overdue. Please contact support."
    },
    Backend: {
        enabled: true,
        action: "error", // "error", "disable", "limited_access"
        errorMessage: "Service suspended due to overdue payment.",
        allowedEndpoints: ["/api/public"] // For limited_access mode
    },
    Frontend: {
        enabled: true,
        action: "redirect", // "redirect", "overlay", "disable"
        redirectUrl: "https://yourwebsite.com/payment",
        errorMessage: "Please update your payment to continue."
    }
};

await application.save();
```

### Set Payment Due Dates
```javascript
// Set initial due date
application.PaymentDueDate = new Date('2025-07-01');

// Or calculate next due date automatically
const nextDueDate = application.calculateNextDueDate();
application.PaymentDueDate = nextDueDate;

await application.save();
```

## Automated Tasks

### Daily Overdue Check
Run this daily to update overdue status:

```javascript
import { PaymentScheduler } from './Utils/PaymentScheduler';

// Manual check
const result = await PaymentScheduler.dailyOverdueCheck();
console.log(`Found ${result.overdueCount} overdue applications`);

// Or set up automated cron job (install node-cron first)
import cron from 'node-cron';

cron.schedule('0 9 * * *', async () => {
    await PaymentScheduler.dailyOverdueCheck();
});
```

## Error Responses

When payment is overdue, clients will receive:

```json
{
  "error": "PAYMENT_OVERDUE",
  "message": "Payment is overdue",
  "action": {
    "crash": true,
    "redirect": true,
    "redirectUrl": "https://yourwebsite.com/payment-overdue"
  }
}
```

HTTP Status Codes:
- `402`: Payment Required
- `403`: Service Disabled

## Security Notes

1. Always validate Application IDs server-side
2. Use HTTPS for all payment-related communications
3. Log overdue access attempts for monitoring
4. Consider rate limiting the overdue check endpoints
5. Regularly backup payment history data

## Monitoring

The system logs overdue applications and access attempts. Monitor these logs to:
- Track payment compliance
- Identify frequently overdue clients
- Generate payment reports
- Set up alerts for critical applications

## Testing

Test the overdue system by:
1. Creating a test application with a past due date
2. Setting `OverdueGracePeriodDays` to 0 for immediate testing
3. Making requests from different client types
4. Verifying correct responses and actions
