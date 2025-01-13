/**
 *  @file        Types\QR.ts
 *  @description No description available for Types\QR.ts.
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *  FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 12:54 PM IST (Kolkata +5:30 UTC)
 */

// ? Templates

// @ UPI -> Brands : GPay, PhonePe, Paytm, Fampay, Amazonpay, 
// @ Wifi
// @ Bluetooth
// @ Contact
// @ Email
// @ Phone
// @ SMS
// @ URL

// @ Text
// @ VCard
// @ MeCard
// @ Location
// @ Event

// @ Facebook
// @ Instagram
// @ Twitter
// @ LinkedIn
// @ YouTube
// @ WhatsApp

// @ Bitcoin
// @ Ethereum
// @ Dogecoin
// @ Litecoin
// @ Ripple

enum DataTemplates {
    // ? UPI
    GPay = "GPay",
    PhonePe = "PhonePe",
    Paytm = "Paytm",
    Fampay = "Fampay",
    Amazonpay = "Amazonpay",

    Wifi = "Wifi",
    Bluetooth = "Bluetooth",
    Contact = "Contact",
    Email = "Email",
    Phone = "Phone",
    SMS = "SMS",
    URL = "URL",

    Text = "Text",
    VCard = "VCard",
    MeCard = "MeCard",
    Location = "Location",
    Event = "Event",

    Facebook = "Facebook",
    Instagram = "Instagram",
    Twitter = "Twitter",
    LinkedIn = "LinkedIn",
    YouTube = "YouTube",
    WhatsApp = "WhatsApp",
}

export { DataTemplates };