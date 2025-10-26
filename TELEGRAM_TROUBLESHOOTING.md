# 🔧 Telegram Notification Troubleshooting

## ❌ Error: "Request failed with status code 400"

This error means there's an issue with your Telegram configuration. Follow these steps to fix it:

### 🔍 Step 1: Validate Your Setup

1. **Login to your admin dashboard**
2. **Click "🔍 Validate Telegram"** button
3. **Check the validation results**

### 🤖 Step 2: Fix Bot Token Issues

**Problem: Invalid Bot Token Format**
- ✅ **Correct format**: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
- ❌ **Wrong**: Missing colon, extra spaces, incomplete token

**How to get correct bot token:**
1. Open Telegram, search `@BotFather`
2. Send `/newbot`
3. Follow instructions to create bot
4. **Copy the ENTIRE token** (including the colon)
5. Update your `.env` file:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### 💬 Step 3: Fix Chat ID Issues

**Problem: Invalid Chat ID**
- ✅ **Correct format**: `123456789` (just numbers)
- ❌ **Wrong**: `"123456789"` (with quotes), `@username`, text

**How to get correct chat ID:**
1. **Start a chat** with your bot (send any message)
2. **Visit this URL** in browser (replace YOUR_BOT_TOKEN):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
3. **Find the "id" number** in the response:
   ```json
   {
     "message": {
       "chat": {
         "id": 123456789,  ← This is your chat ID
         "type": "private"
       }
     }
   }
   ```
4. **Update your .env file** (NO QUOTES):
   ```
   TELEGRAM_CHAT_ID=123456789
   ```

### 🚫 Step 4: Common Mistakes

**❌ Bot hasn't been started:**
- You MUST send at least one message to your bot first
- The bot cannot send messages to users who haven't started a chat

**❌ Quotes around numbers:**
```bash
# WRONG
TELEGRAM_CHAT_ID="123456789"

# CORRECT
TELEGRAM_CHAT_ID=123456789
```

**❌ Spaces in token:**
```bash
# WRONG
TELEGRAM_BOT_TOKEN=123456789: ABCdefGHI

# CORRECT
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI
```

### 🔄 Step 5: Test Your Fix

1. **Restart your server** after changing `.env`
2. **Click "🔍 Validate Telegram"** - should show all ✅
3. **Click "🧪 Test Notifications"** → choose "telegram"
4. **Check your Telegram** for the test message

## 📱 Complete Setup Example

### Your .env file should look like:
```bash
# Telegram Configuration
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### Step-by-step verification:
1. ✅ Bot token has format: `numbers:letters`
2. ✅ Chat ID is just numbers (no quotes)
3. ✅ You've sent a message to your bot
4. ✅ No extra spaces or characters
5. ✅ Server restarted after changes

## 🆘 Still Having Issues?

### Check Server Logs:
Look for these debug messages in your console:
```
🔍 Telegram Debug Info:
- Bot Token: 123456789...
- Chat ID: 123456789
- Chat ID Type: number
```

### Manual Test:
Test your credentials directly:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": <YOUR_CHAT_ID>, "text": "Test message"}'
```

### Common Error Responses:

**400 Bad Request - Invalid token:**
```json
{"ok":false,"error_code":401,"description":"Unauthorized"}
```
→ Fix your bot token

**400 Bad Request - Invalid chat:**
```json
{"ok":false,"error_code":400,"description":"Bad Request: chat not found"}
```
→ Fix your chat ID or start a chat with the bot

**Success Response:**
```json
{"ok":true,"result":{"message_id":123,...}}
```
→ Everything is working!

## ✅ Quick Checklist

- [ ] Bot created via @BotFather
- [ ] Bot token copied correctly (with colon)
- [ ] Started a chat with your bot
- [ ] Chat ID obtained from /getUpdates
- [ ] .env file updated with correct values
- [ ] No quotes around chat ID
- [ ] Server restarted
- [ ] Validation shows all ✅
- [ ] Test notification works

Once all items are checked, your Telegram notifications should work perfectly! 🎉