#Call.
See who is in the call

## Getting Started

- Install local packages `npm install`
- `cd src/ && node app`
- In your browser go to `http://localhost:3000`


## Adding people
simply `POST` to  `http://localhost:3000/people` with something like this in the 
request body.

```
[
	"Carl Sagan",
	"Einstein",
	"Charles Darwin",
	"Alan Turing",
	"Alonzo Church"
]
```

or add a single person
```
{
	"name": "Nikola Tesla",
	"isHere": false
}
```