# Client side secure hashing
Conventionally secure hashing is done server side. This repository demonstrates there are advantages to hashing client side, which are covered in this readme. Precautions are taken to prevent pass-the-hash by adding an additional fast sha256 hash server side.

# Demos
For a simple demo of bcrypt done clientside, see here https://security.love/clientHashing/

For a more complicated server-client demo, you can follow the setup instructions seen below

```
git clone https://github.com/dxa4481/clientHashing.git
cd clientHashing
npm install
node start
```

Then browse to http://localhost:3000/client.html

Note: These demos leverage the [WebCryptoAPI](https://www.w3.org/TR/WebCryptoAPI/) and are very efficient on modern browsers. They do not rely on *purely* Javascript hashing. See the [bcrypt library](https://github.com/dcodeIO/bcrypt.js) used for more information

## What is secure password hashing?
Secure password hashing is a specially crafted hash algorithm that's designed to slow an attacker down in the event of a hash leak. Here's a few examples of secure hashing functions

- bcrypt
- pbkdf2
- scrypt

They are typically very CPU intensive, by design, and they all have salts built into them preventing [rainbow tables](https://en.wikipedia.org/wiki/Rainbow_table) attacks. Additionally these hash functions all have a configurable number of rounds, enabling the developer to set how slow they want the hash function to be.

Here's an example: with a non-secure password hashing algorithm, sha256, on my computer I can crack at a rate of 18,000,000 hashes / second as seen below. Note: this can potentially be sped up with a rainbow table.

```
Input.Mode: Dict (wordlists/rockyou.txt)
Index.....: 3/5 (segment), 3323236 (words), 33550344 (bytes)
Recovered.: 0/1 hashes, 0/1 salts
Speed/sec.: 18.37M plains, 287.03k words
Progress..: 2601623/3323236 (78.29%)
Running...: 00:00:00:09
Estimated.: 00:00:00:02
```

But with a secure password hash function, bcrypt, this get's reduced dramatically to 50 hashes / second, as seen below

```
Input.Mode: Dict (wordlists/rockyou.txt)
Index.....: 1/5 (segment), 3627101 (words), 33550342 (bytes)
Recovered.: 0/1 hashes, 0/1 salts
Speed/sec.: 50 plains, - words
Progress..: 0/3627101 (0.00%)
Running...: 00:00:00:06
Estimated.: --:--:--:--
```

It's about **x360,000** slower.

## Why do it client side?
Conventionally a client would send one's cleartext password to the server over TLS. This password would be hashed serverside, and checked against the hash stored in the DBMS. 
The disadvantages of this are
- It's computationally expensive for the server. It's actually designed to be computationally expensive. 
- In the unlikely compromise from a passive man in the middle attack, one's credentials could be sniffed.
- It's cheap for clients to brute force the server by attempting to log into multiple user accounts

Addressing the last bullet point, if an attacker got a list of all users for example, they could send many concurrent requests to the server and either cause a DoS condition, or possibly log into a user account.

#### Client side hashing addresses these issues
When hashing clientside there is very little load on the server when logging a user in. The hashing CPU load is distributed to all of the concurrent users. Cleartext credentials (over TLS) are also never transmitted to the server; only the user's hash is sent to the server. It's also extremely expensive for a client to attempt to brute force the server's login across multiple users. 

## What does it look like?
Because these secure password hashing algorithms use a salt, when user's log in, the server will need to present the user with a salt. To prevent [Pass the Hash](https://en.wikipedia.org/wiki/Pass_the_hash) like attacks, the server will also need to perform one last final hash on the user's presented hash. The full workflow is shown below
![login diagram](http://i.imgur.com/STDGUVD.png)

Logging in on the client side looks something like this:

```javascript
var login = function(){
    $.get({
        url: "getSalt",
        success: function(data){
            var password = document.getElementById("password").value;
            var hash = bcrypt.hashSync(password, data.salt);
            $.post({
                url: "login", 
                data: JSON.stringify({"hash": hash}),
                contentType: "application/json",
                success: function(data){
                    alert(data.success);
                }   
            }); 
        }   
    }); 
}
```

and the server code looks something like this

```javascript
app.post('/login', function(req, res){
    var usersHash = crypto.createHash('sha256').update(req.body.hash, 'utf8').digest("hex");
    res.json({success: (hash == usersHash)})
});
```


## Disadvantages
There are some drawbacks to this.
- User enumeration: requesting salt for an unauthenticated user could help an attacker identify if an account exists or not
- User's need Javascript enabled to login
- Password complexity requirements would have to be maintained clientside
- Less capable client machines may experience issues logging in

Addressing the second to last bullet point, because the server no longer touches the user's actual password, you would have to rely on [client side password validation](https://github.com/dropbox/zxcvbn), which is not ideal because users could theoretically go out of their way to bypass the application protections and set their passwords to be very weak.

Addressing the last bullet, it took my phone (an HTC One m7) approximately 4 seconds to complete the simple demo of client side bcrypt.
