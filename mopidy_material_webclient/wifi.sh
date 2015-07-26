
if [ "$1" != "" ]
then
    #put wifi settings for wpa roaming
    if [ "$2" != "" ]
    then
        cat >/etc/wpa.conf <<EOF
            ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
            update_config=1
            network={
                ssid="$1"
                psk="$2"
                scan_ssid=1
            }
EOF
    else
        #if no password is given, set key_mgmt to NONE
        cat >/etc/wpa.conf <<EOF
            ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
            update_config=1
            network={
                ssid="$2"
                key_mgmt=NONE
                scan_ssid=1
            }
EOF
    fi

    ifup wlan0

    service networking stop
    service networking start
fi
