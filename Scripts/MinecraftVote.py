import asyncio
import time
import random
import logging
import nodriver as uc
from typing import Optional, List, Any
import re

# Configuration
MINECRAFT_USERNAME = "TeamSM"
VOTE_DELAY_MIN = 5  # Minimum delay between votes (seconds)
VOTE_DELAY_MAX = 15  # Maximum delay between votes (seconds)

# Voting sites configuration with navigation details
VOTING_SITES = [
    {
        "name": "Noteblock.gg",
        "profile_url": "https://noteblock.gg/server/skymines-RgcC",
        "vote_button_text": ["Vote", "vote", "VOTE"],
        "vote_selectors": [
            "button:contains('Vote')",
            "a:contains('Vote')", 
            ".vote-btn",
            ".btn-vote",
            "[data-vote]"
        ],
        "username_selectors": [
            "input[name='username']",
            "input[placeholder*='username']",
            "input[placeholder*='Username']",
            "input[type='text']"
        ],
        "submit_selectors": [
            "button[type='submit']",
            "input[type='submit']",
            "button:contains('Submit')",
            ".submit-btn"
        ],
        "captcha_type": "cloudflare_turnstile",
        "requires_cloudflare_check": False,
        "navigation_type": "button_to_modal"  # Click vote button opens modal
    },
    {
        "name": "TopMinecraftServers",
        "profile_url": "https://topminecraftservers.org/server/12744",
        "vote_button_text": ["Vote", "vote", "VOTE"],
        "vote_selectors": [
            "button:contains('Vote')",
            "a:contains('Vote')",
            ".vote-button",
            ".btn-vote"
        ],
        "username_selectors": [
            "input[name='username']",
            "input[placeholder*='username']",
            "input[placeholder*='Username']"
        ],
        "submit_selectors": [
            "button[type='submit']",
            "input[type='submit']"
        ],
        "captcha_type": "cloudflare_check",
        "requires_cloudflare_check": True,
        "navigation_type": "button_to_page"  # Click vote button goes to vote page
    },
    {
        "name": "Minecraft-Server-List",
        "profile_url": "https://minecraft-server-list.com/server/469862",
        "vote_button_text": ["Vote", "vote", "VOTE"],
        "vote_selectors": [
            "button:contains('Vote')",
            "a:contains('Vote')",
            ".vote-btn"
        ],
        "username_selectors": [
            "input[name='username']",
            "input[placeholder*='username']"
        ],
        "submit_selectors": [
            "button[type='submit']",
            "input[type='submit']"
        ],
        "captcha_type": "none",
        "requires_cloudflare_check": False,
        "navigation_type": "button_to_page"
    },
    {
        "name": "Minecraft-MP",
        "profile_url": "https://minecraft-mp.com/server-s255224",
        "vote_button_text": ["Vote", "vote", "VOTE"],
        "vote_selectors": [
            "button:contains('Vote')",
            "a:contains('Vote')",
            ".vote-btn"
        ],
        "username_selectors": [
            "input[name='username']",
            "input[placeholder*='username']"
        ],
        "submit_selectors": [
            "button[type='submit']",
            "input[type='submit']"
        ],
        "captcha_type": "cloudflare_turnstile",
        "requires_cloudflare_check": False,
        "navigation_type": "button_to_page"
    },
    {
        "name": "MinecraftBestServers",
        "profile_url": "https://minecraftbestservers.com/server-ultimismc.142",
        "vote_button_text": ["Vote", "vote", "VOTE"],
        "vote_selectors": [
            "button:contains('Vote')",
            "a:contains('Vote')",
            ".vote-button"
        ],
        "username_selectors": [
            "input[name='username']",
            "input[placeholder*='username']"
        ],
        "submit_selectors": [
            "button[type='submit']",
            "input[type='submit']"
        ],
        "captcha_type": "none",
        "requires_cloudflare_check": False,
        "navigation_type": "button_to_page"
    },
    {
        "name": "MinecraftIPList",
        "profile_url": "https://www.minecraftiplist.com/server/UltimisMC-35984",
        "vote_button_text": ["Vote", "vote", "VOTE"],
        "vote_selectors": [
            "button:contains('Vote')",
            "a:contains('Vote')",
            ".vote-btn"
        ],
        "username_selectors": [
            "input[name='username']",
            "input[placeholder*='username']"
        ],
        "submit_selectors": [
            "button[type='submit']",
            "input[type='submit']"
        ],
        "captcha_type": "hcaptcha",
        "requires_cloudflare_check": False,
        "navigation_type": "button_to_page"
    }
]

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('minecraft_voting.log'),
        logging.StreamHandler()
    ]
)

class MinecraftVoter:
    def __init__(self):
        self.browser = None
        self.page = None
        self.successful_votes = 0
        self.failed_votes = 0
        
    async def init_browser(self):
        """Initialize nodriver browser"""
        try:
            # Launch browser with stealth mode
            self.browser = await uc.start(
                headless=False,  # Set to True for headless mode
                user_data_dir=None,  # Use temporary profile
                # sandbox=False,
                lang="en-US"
            )
            
            # Get the first tab/page
            self.page = self.browser.main_tab
            
            logging.info("Nodriver browser initialized successfully")
            return True
            
        except Exception as e:
            logging.error(f"Failed to initialize browser: {e}")
            return False
    
    async def random_delay(self, min_seconds=2, max_seconds=5):
        """Add random delay to mimic human behavior"""
        delay = random.uniform(min_seconds, max_seconds)
        await asyncio.sleep(delay)
    
    async def human_type(self, element, text: str):
        """Type text with human-like delays"""
        await element.click()
        await self.random_delay(0.2, 0.5)
        
        # Clear existing text (Ctrl+A then type)
        await element.send_keys(uc.Keys.CTRL + 'a')
        await self.random_delay(0.1, 0.3)
        await element.send_keys(text)
        await self.random_delay(0.3, 0.8)
    
    async def find_element_by_selectors(self, selectors: List[str], timeout: int = 10) -> Optional[Any]:
        """Try to find element using multiple selectors"""
        for selector in selectors:
            try:
                # Handle text-based selectors
                if ":contains(" in selector:
                    text = selector.split(":contains('")[1].split("')")[0]
                    tag = selector.split(":contains(")[0] or "*"
                    
                    # Find all elements of the tag type
                    try:
                        elements = await self.page.find_elements(tag)
                        for element in elements:
                            try:
                                element_text = await element.text
                                if text.lower() in element_text.lower():
                                    return element
                            except:
                                continue
                    except:
                        continue
                else:
                    # Regular CSS selector
                    try:
                        element = await self.page.find(selector, timeout=timeout)
                        if element:
                            return element
                    except:
                        continue
            except Exception as e:
                logging.debug(f"Selector '{selector}' failed: {e}")
                continue
        
        return None
    
    async def find_vote_button_on_profile(self, site_config) -> Optional[Any]:
        """Find the vote button on the server profile page"""
        logging.info(f"Looking for vote button on {site_config['name']} profile page")
        
        # Try vote button selectors
        vote_button = await self.find_element_by_selectors(site_config["vote_selectors"], timeout=5)
        
        if not vote_button:
            # Try finding by text content
            for text in site_config["vote_button_text"]:
                try:
                    # Look for buttons containing vote text
                    buttons = await self.page.find_elements("button, a, div[role='button'], .btn")
                    for button in buttons:
                        try:
                            button_text = await button.text
                            if text in button_text:
                                return button
                        except:
                            continue
                except:
                    continue
        
        return vote_button
    
    async def handle_cloudflare_check(self, site_config):
        """Handle Cloudflare browser verification using nodriver's built-in method"""
        if not site_config.get("requires_cloudflare_check", False):
            return True
            
        try:
            logging.info(f"Checking for Cloudflare verification on {site_config['name']}")
            
            # Wait a bit and check page content
            await self.random_delay(3, 6)
            
            page_content = await self.page.get_content()
            page_title = self.page.title
            
            # Check if we're on a Cloudflare check page
            cf_indicators = [
                "checking your browser",
                "cloudflare", 
                "please wait",
                "verifying you are human",
                "ddos protection",
                "cf-turnstile",
                "turnstile"
            ]
            
            cf_detected = any(indicator in page_content.lower() or 
                            indicator in page_title.lower() 
                            for indicator in cf_indicators)
            
            if cf_detected:
                logging.info("Cloudflare verification detected, using nodriver's built-in verify_cf() method...")
                
                try:
                    # Use nodriver's built-in Cloudflare verification
                    await self.page.verify_cf()
                    logging.info("✓ Cloudflare verification completed successfully using nodriver")
                    await self.random_delay(2, 4)
                    return True
                    
                except Exception as cf_error:
                    logging.warning(f"Built-in CF verification failed: {cf_error}")
                    logging.info("Falling back to manual verification...")
                    
                    # Fallback to manual verification
                    max_wait = 30
                    start_time = time.time()
                    
                    while time.time() - start_time < max_wait:
                        await asyncio.sleep(2)
                        
                        current_content = await self.page.get_content()
                        current_title = self.page.title
                        
                        # Check if we've moved past the Cloudflare check
                        cf_still_present = any(indicator in current_content.lower() or indicator in current_title.lower() for indicator in cf_indicators)
                        
                        if not cf_still_present:
                            logging.info("Cloudflare check completed manually")
                            await self.random_delay(2, 4)
                            return True
                    
                    logging.warning("Cloudflare check taking longer than expected")
                    input("If you see a Cloudflare challenge, please complete it manually and press Enter...")
                    return True
            
            return True
            
        except Exception as e:
            logging.warning(f"Error handling Cloudflare check: {e}")
            return True
    async def handle_captcha(self, site_config):
        """Handle different types of captchas using nodriver's built-in methods"""
        captcha_type = site_config.get("captcha_type", "none")
        
        if captcha_type == "none":
            return True
            
        try:
            logging.info(f"Checking for {captcha_type} on {site_config['name']}")
            
            # Wait a bit for captcha to load
            await self.random_delay(2, 4)
            
            # Check page content for captcha indicators
            page_content = await self.page.get_content()
            
            captcha_indicators = {
                "cloudflare_turnstile": ["turnstile", "cloudflare", "cf-turnstile"],
                "hcaptcha": ["hcaptcha", "h-captcha"],
                "cloudflare_check": ["checking your browser", "cloudflare"]
            }
            
            indicators = captcha_indicators.get(captcha_type, [])
            captcha_detected = any(indicator in page_content.lower() for indicator in indicators)
            
            if captcha_detected:
                logging.warning(f"{captcha_type} detected on {site_config['name']}")
                
                if captcha_type == "cloudflare_turnstile" or captcha_type == "cloudflare_check":
                    logging.info("Using nodriver's built-in Cloudflare verification...")
                    try:
                        # Use nodriver's built-in Cloudflare verification for Turnstile
                        await self.page.verify_cf()
                        logging.info(f"✓ {captcha_type} solved successfully using nodriver")
                        await self.random_delay(2, 4)
                        return True
                        
                    except Exception as cf_error:
                        logging.warning(f"Built-in CF verification failed: {cf_error}")
                        logging.info("Falling back to manual solving...")
                        # Wait a bit for auto-solving if it's Turnstile
                        if captcha_type == "cloudflare_turnstile":
                            logging.info("Waiting for Turnstile to auto-solve...")
                            await self.random_delay(5, 10)
                        
                        # Check if manual intervention is needed
                        input(f"Please solve the {captcha_type} captcha if present and press Enter to continue...")
                        
                elif captcha_type == "hcaptcha":
                    # hCaptcha requires manual solving
                    logging.info("hCaptcha detected - requires manual solving")
                    input("Please solve the hCaptcha and press Enter to continue...")
                    
                else:
                    # Generic captcha handling
                    input(f"Please solve the {captcha_type} captcha if present and press Enter to continue...")
                
            return True
            
        except Exception as e:
            logging.warning(f"Error handling captcha: {e}")
            return True
    
    async def handle_certificate_warning(self):
        """Handle insecure connection warnings using nodriver's built-in method"""
        try:
            page_content = await self.page.get_content()
            
            # Check for certificate warning indicators
            cert_indicators = [
                "your connection is not private",
                "not secure", 
                "certificate error",
                "ssl error",
                "insecure connection",
                "proceed to",
                "advanced"
            ]
            
            cert_warning_detected = any(indicator in page_content.lower() for indicator in cert_indicators)
            
            if cert_warning_detected:
                logging.info("Certificate warning detected, using nodriver's bypass method...")
                try:
                    await self.page.bypass_insecure_connection_warning()
                    logging.info("✓ Certificate warning bypassed successfully")
                    await self.random_delay(2, 3)
                    return True
                except Exception as bypass_error:
                    logging.warning(f"Failed to bypass certificate warning: {bypass_error}")
                    return False
            
            return True
            
        except Exception as e:
            logging.warning(f"Error handling certificate warning: {e}")
            return True
    async def vote_on_site(self, site_config):
        """Vote on a specific site"""
        try:
            logging.info(f"Starting vote process for {site_config['name']}")
            
            # Navigate to the server profile page
            await self.page.get(site_config["profile_url"])
            await self.random_delay(3, 6)
            
            # Handle certificate warnings first
            await self.handle_certificate_warning()
            
            # Handle Cloudflare check if required
            await self.handle_cloudflare_check(site_config)
            
            # Find the vote button on the profile page
            vote_button = await self.find_vote_button_on_profile(site_config)
            if not vote_button:
                logging.error(f"Could not find vote button on {site_config['name']} profile page")
                return False
            
            logging.info(f"Found vote button on {site_config['name']}")
            
            # Click the vote button
            await vote_button.click()
            await self.random_delay(2, 4)
            
            # Handle navigation type
            if site_config["navigation_type"] == "button_to_modal":
                # Vote form should appear in a modal on the same page
                logging.info("Vote form should appear in modal")
            else:
                # We should be redirected to a vote page
                logging.info("Navigated to vote page")
                
            # Handle any captchas on the vote page/modal
            await self.handle_captcha(site_config)
            
            # Find username input field
            username_input = await self.find_element_by_selectors(
                site_config["username_selectors"], timeout=10
            )
            
            if not username_input:
                logging.error(f"Could not find username input on {site_config['name']}")
                return False
            
            # Enter username
            logging.info(f"Entering username: {MINECRAFT_USERNAME}")
            await self.human_type(username_input, MINECRAFT_USERNAME)
            
            # Handle captcha again before submitting
            await self.handle_captcha(site_config)
            
            # Find and click submit button
            submit_button = await self.find_element_by_selectors(
                site_config["submit_selectors"], timeout=5
            )
            
            if not submit_button:
                logging.error(f"Could not find submit button on {site_config['name']}")
                return False
            
            # Submit the vote
            await submit_button.click()
            logging.info(f"Submitted vote on {site_config['name']}")
            await self.random_delay(3, 5)
            
            # Check for success
            success = await self.check_vote_success()
            
            if success:
                logging.info(f"✓ Successfully voted on {site_config['name']}")
                self.successful_votes += 1
                return True
            else:
                logging.warning(f"✗ Vote may have failed on {site_config['name']}")
                self.failed_votes += 1
                return False
                
        except Exception as e:
            logging.error(f"Error voting on {site_config['name']}: {e}")
            self.failed_votes += 1
            return False
    
    async def check_vote_success(self):
        """Check if vote was successful"""
        try:
            await self.random_delay(2, 3)
            
            page_content = await self.page.get_content()
            page_title = self.page.title
            
            success_indicators = [
                "success", "voted", "thank you", "thanks", 
                "vote recorded", "vote submitted", "vote cast",
                "vote successful", "voting successful"
            ]
            
            cooldown_indicators = [
                "already voted", "cooldown", "wait", "try again",
                "next vote", "24 hour", "come back"
            ]
            
            # Check for cooldown first (consider as success since we can't vote anyway)
            for indicator in cooldown_indicators:
                if indicator in page_content.lower() or indicator in page_title.lower():
                    logging.info("User appears to be on cooldown for this site")
                    return True
            
            # Check for success indicators
            for indicator in success_indicators:
                if indicator in page_content.lower() or indicator in page_title.lower():
                    return True
                    
            return False
            
        except Exception as e:
            logging.warning(f"Error checking vote success: {e}")
            return False
    
    async def vote_all_sites(self):
        """Vote on all configured sites"""
        if not await self.init_browser():
            return
        
        try:
            logging.info(f"Starting voting process for username: {MINECRAFT_USERNAME}")
            logging.info(f"Total sites to vote on: {len(VOTING_SITES)}")
            
            for i, site_config in enumerate(VOTING_SITES, 1):
                logging.info(f"\n{'='*50}")
                logging.info(f"Processing site {i}/{len(VOTING_SITES)}: {site_config['name']}")
                logging.info(f"Profile URL: {site_config['profile_url']}")
                
                success = await self.vote_on_site(site_config)
                
                if success:
                    logging.info(f"✓ Vote successful on {site_config['name']}")
                else:
                    logging.error(f"✗ Vote failed on {site_config['name']}")
                
                # Add delay between sites
                if i < len(VOTING_SITES):
                    delay = random.randint(VOTE_DELAY_MIN, VOTE_DELAY_MAX)
                    logging.info(f"Waiting {delay} seconds before next site...")
                    await asyncio.sleep(delay)
            
            # Final summary
            total_sites = len(VOTING_SITES)
            logging.info(f"\n{'='*50}")
            logging.info(f"VOTING SUMMARY")
            logging.info(f"{'='*50}")
            logging.info(f"Total sites: {total_sites}")
            logging.info(f"Successful votes: {self.successful_votes}")
            logging.info(f"Failed votes: {self.failed_votes}")
            logging.info(f"Success rate: {(self.successful_votes/total_sites)*100:.1f}%")
            
        except Exception as e:
            logging.error(f"Critical error during voting process: {e}")
        
        finally:
            if self.browser:
                try:
                    await self.browser.stop()
                    logging.info("Browser closed")
                except:
                    pass

async def main():
    """Main function to run the voting script"""
    print("=== Minecraft Auto Voter (Nodriver) ===")
    print(f"Username: {MINECRAFT_USERNAME}")
    print(f"Sites to vote on: {len(VOTING_SITES)}")
    print("\nCaptcha Information:")
    for site in VOTING_SITES:
        captcha_info = site['captcha_type'].replace('_', ' ').title() if site['captcha_type'] != 'none' else 'No captcha'
        print(f"  • {site['name']}: {captcha_info}")
    
    print("\n⚠️  You may need to manually solve some captchas during the process")
    print("Starting in 5 seconds...")
    await asyncio.sleep(5)
    
    voter = MinecraftVoter()
    await voter.vote_all_sites()

if __name__ == "__main__":
    asyncio.run(main())