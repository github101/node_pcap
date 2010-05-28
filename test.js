"use strict";
/*global process require exports */

var sys = require("sys"),
    pcap = require("./pcap"),
    count = 0,
    start_time = new Date(),
    pcap_session = pcap.createSession("", "host ranney.com"),
    dns_cache = pcap.dns_cache,
    tcp_tracker = pcap.tcp_tracker,
    http = require('http'),
    http_server;

// Print all devices, currently listening device prefixed with an asterisk
sys.puts("All devices:");
pcap_session.findalldevs().forEach(function (dev) {
    if (pcap_session.device_name === dev.name) {
        sys.print("* ");
    }
    sys.print(dev.name + " ");
    if (dev.addresses.length > 0) {
        dev.addresses.forEach(function (address) {
            sys.print(address.addr + "/" + address.netmask);
        });
        sys.print("\n");
    } else {
        sys.print("no address\n");
    }
});

// listen for packets, decode them, and feed TCP to the tracker
pcap_session.addListener('packet', function (raw_packet) {
    var packet = pcap.decode.packet(raw_packet),
        link = packet.link,
        ip, tcp, stats;

    if (link && link.ip) {
        ip = link.ip;
        if (ip.tcp) {
            tcp = ip.tcp;
            // sys.puts(dns_cache.ptr(ip.saddr) + ":" + tcp.sport + " > " + 
            //     dns_cache.ptr(ip.daddr) + ":" + tcp.dport + " TCP length " + raw_packet.pcap_header.len + " seq " + tcp.seqno + " ack " + tcp.ackno);
            tcp_tracker.track(packet);
        } else {
            sys.puts(dns_cache.ptr(ip.saddr) + " > " + dns_cache.ptr(ip.daddr) + 
                " " + ip.protocol_name + " length " + raw_packet.pcap_header.len);
        }
    } else {
        sys.puts("Non IP: " + sys.inspect(p));
    }
    
    stats = pcap_session.stats();
    if (stats.ps_drop > 0) {
        sys.puts("pcap dropped packets: " + sys.inspect(stats));
    }
});

// Coming soon:
//
// tcp_tracker.addListener('start', function (session) {
//     
// });
// 
// tcp_tracker.addListener('end', function (session) {
//     
// });


process.addListener("uncaughtException", function (event) {
    sys.puts("Uncaught Exception: " + event.stack);
});

function do_error(response, code, message) {
    sys.puts("do_error: " + code + " - " + message);
    response.writeHead(code, {
        "Content-Type": "text/plain"
    });
    response.write(message);
    response.end();
}

function new_client (new_request, new_response) {
    sys.puts(new_request.connection.remoteAddress + " " + new_request.method + " " + new_request.url);
    if (new_request.method === "GET") {

    }
    else {
        do_error(new_response, 404, "WTF");
    }
}

http_server = http.createServer(new_client);
http_server.listen(80);
sys.puts("Listening for HTTP");
