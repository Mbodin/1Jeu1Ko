/* This file is meant to explore compression algorithms, in order to optimise
 * the size of games that are very close to the threshold. */

bw_encode = txt => {
		let l = txt.length;
		let perm =
			Array(l).fill().map((_, i) =>
					txt.substr(i, l - i) + txt.substr(0, i)
				).sort();
		let i = perm.indexOf(txt) ;
		return String(i) + perm.map(s => s[txt.length - 1]).join("");
	};

bw_decode = t => {
		let aux = a => {
				a = a.sort();
				if (a[0].length === t.length)
					return a
				else {
					a = a.map((v, i) => t[i] + v);
					aux (a)
				}
			};
		return aux (t.split(""))
	};

/*
l="length";
b=a=>(a=a.sort())[0][l]==t[l]?a:b(a.map((v,i)=>t[i]+v));
bw_decode_opt = t=>b(t.split(""))
*/

fuse_encode = (c, txt) => {
		var ret = "";
		var st = false;
		let pop = _ => {
				if (st[1] === 1) {
					if (st[0] === c)
						ret += c + "1" + c
					else ret += st[0]
				} else
					ret += c + st[1] + st[0];
				st = false;
			};
		for (i = 0; i < txt.length; i++){
			if (st){
				if (txt[i] === st[0] && st[1] < 9) st[1]++
				else {
					pop ();
					st = [txt[i], 1]
				}
			} else st = [txt[i], 1];
		}
		if (st) pop ();
		return ret
	};

fuse_decode = (c, txt) => {
		let aux = i => {
				if (i >= txt.length) return "";
				else if (txt[i] === c){
					return txt[i + 2].repeat(txt[i + 1]) + aux (i + 3)
				} else return txt[i] + aux (i + 1)
			}
		return aux(0)
	};

/*
l="length";
c="^";
f=i=>i>=t[l]?"":(t[i++]==c?t[i+=2].repeat(t[i-1]):t[i-1])+f(i)
fuse_decode_opt = s=>(t=s,f(0))
*/

let all_characters = "!@#$%^&*()_+`~=-[]{};:<>,.?/'| abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ¦°“”«»¶¡¿÷×‘’¤€0123456789";

fuse_auto_encode = txt => {
		let all = all_characters;
		let c;
		for (let i = 0; i < all.length; i++){
			if (txt.indexOf(all[i]) === -1)
				return all[i] + fuse_encode (c, txt)
		}
		throw "fuse_auto_encode: No character found!";
	};

fuse_alpha_encode = (c, txt) => {
		if (c.indexOf("\\") !== -1) throw "Invalid alphabet.";
		var ret = "";
		var st = false;
		let pop = _ => {
				if (st[1] <= 2){
					if (c.indexOf(st[0]) === -1)
						ret += st[0].repeat(st[1])
					else ret += ("\\" + st[0]).repeat(st[1])
				} else
					ret += c[st[1] - 3] + st[0];
				st = false;
			};
		for (i = 0; i < txt.length; i++){
			if (st){
				if (txt[i] === st[0] && st[1] < c.length + 2) st[1]++
				else {
					pop ();
					st = [txt[i], 1]
				}
			} else st = [txt[i], 1];
		}
		if (st) pop ();
		return ret
	};

fuse_alpha_decode = (c, txt) => {
		let aux = i => {
				if (i >= txt.length) return "";
				else {
					let index = c.indexOf(txt[i]);
					if (index !== -1)
						return txt[i + 2].repeat(index + 3) + aux (i + 3)
					else return txt[i] + aux (i + 1)
				}
			}
		return aux(0)
	};

fuse_alpha_auto_encode = max => txt => {
		let all = all_characters;
		let c = [];
		for (let i = 0; i < all.length; i++){
			if (txt.indexOf(all[i]) === -1){
				c.push(all[i]);
				if (c.length === max)
					return c.join("") + c[0] + fuse_alpha_encode (c, txt)
			}
		}
		throw "fuse_alpha_auto_encode: No character found!";
	};



to_front_encode = txt => {
		let all = txt.split("").sort().filter((c, pos, self) => pos === 0 || self [pos - 1] !== c);
		let aux = (stack, i) => {
				if (i === txt.length) return "";
				let c = txt[i];
				let pos = stack.indexOf (c);
				stack.splice (pos, 1);
				stack.splice (0, 0, c);
				return all[pos] + aux (stack, i + 1)
			};
		let encoded = aux (all.slice(), 0);
		all = all.filter (x => encoded.indexOf (x) === -1);
		if (all.length === 0) all = [encoded[0]];
		return all.join("") + all[0] + encoded;
  };

to_front_decode = txt => {
		let sep = txt[0];
		let sepindex = 1 + txt.slice(1).indexOf(sep);
		let all = txt.split("").sort().filter((c, pos, self) => pos === 0 || self [pos - 1] !== c);;
		txt = txt.slice (sepindex + 1);
		let aux = (stack, i) => {
				if (i === txt.length) return "";
				let pos = all.indexOf (txt[i]);
				let c = stack[pos];
				stack.splice (pos, 1);
				stack.splice (0, 0, c);
				return c + aux (stack, i + 1)
			};
		return aux (all.slice(), 0)
	}


find_number = f => txt => {
		let m = 0;
		for(let i = 0; i < 20; i++){
			try{
				let r = f(i)(txt);
				if (m === 0 || m.length > r.length) m = r;
			}catch(_){}
		}
		if (m) return m;
		throw "find_number: No match!"
	}


{
	let readline = require('readline');
	
	let rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

	let all = [
			["bw", bw_encode],
			["fuse", fuse_auto_encode],
			["alpha fuse", find_number (fuse_alpha_auto_encode)],
			["to_front", to_front_encode]
		]

	let steps = 5;

	rl.question ("Input string to compress: ", str => {

		/*
			console.log (bw_encode(str))
			console.log (to_front_encode(bw_encode(str)))
			console.log (fuse_alpha_auto_encode (3) (to_front_encode (bw_encode(str))))
			return
		*/

			let explore = (txt, i) => {
					let basic = { len: txt.length, stack: [] };
					if (i === 0) return [basic];
					let rec =
						all.map (([name, f]) => {
								try {
									return explore (f (txt), i - 1).map (o => {
											let o2 = { len: o.len, stack: o.stack };
											o2.stack.splice (0, 0, name);
											return o2
										})
								} catch (e){
									return []
								}
							});
					let ret = [].concat.apply ([], rec);
					ret.splice (0, 0, basic);
					return ret
				};
			let tab = explore (str, steps);
			tab.sort ((o1, o2) => {
					if (o1.len < o2.len) return -1;
					if (o1.len > o2.len) return 1;
					return 0;
				});
			let cont = -1;
			tab.forEach (o => {
					if (cont < 0 || cont++ < 10) {
						console.log("- " + o.stack.join (", ") + ": " + o.len);
					}
					if (o.stack.length === 0) cont = 0
				})
			if (cont > 10) console.log ("Stopping there. " + tab.length + " explored.");

			rl.close ()
		})
}

