import random
from math import gcd
from sympy import isprime

def generate_prime_candidate(bits):
    p = random.getrandbits(bits)
    p |= (1 << bits - 1) | 1
    return p

def generate_prime(bits):
    p = generate_prime_candidate(bits)
    while not isprime(p):
        p = generate_prime_candidate(bits)
    return p

def multiplicative_inverse(e, phi):
    def extended_gcd(a, b):
        if a == 0:
            return b, 0, 1
        gcd, x1, y1 = extended_gcd(b % a, a)
        x = y1 - (b // a) * x1
        y = x1
        return gcd, x, y

    gcd, x, _ = extended_gcd(e, phi)
    if gcd != 1:
        raise Exception('Modular inverse does not exist')
    return x % phi

def generate_keypair(bits):
    p = generate_prime(bits)
    q = generate_prime(bits)
    while p == q:
        q = generate_prime(bits)

    n = p * q
    phi = (p - 1) * (q - 1)

    e = random.randrange(1, phi)
    while gcd(e, phi) != 1:
        e = random.randrange(1, phi)

    d = multiplicative_inverse(e, phi)
    return ((e, n), (d, n))

def encrypt(public_key, plaintext):
    e, n = public_key
    ciphertext = [pow(ord(char), e, n) for char in plaintext]
    return ciphertext

def decrypt(private_key, ciphertext):
    d, n = private_key
    plaintext = ''.join([chr(pow(char, d, n)) for char in ciphertext])
    return plaintext

if __name__ == "__main__":
    print("Generating RSA key pair...")
    public, private = generate_keypair(8)
    print(f"Public Key: {public}")
    print(f"Private Key: {private}")

    message = "Hello RSA!"
    print(f"Original Message: {message}")

    encrypted_message = encrypt(public, message)
    print(f"Encrypted Message: {encrypted_message}")

    decrypted_message = decrypt(private, encrypted_message)