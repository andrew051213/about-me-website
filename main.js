const info = new Vue({
    el: '.page',
    data: {
        info: {
            stuff: {
                active: false,
                loading: false,
                checking: false,
                ownerDiscordId: "651476767332237343",
                backgroundImage: "https://i.pinimg.com/originals/80/8b/ac/808bac097a1fb99f766ef32c8315bd9f.gif",
                github: "https://github.com/dqrkles",
                ownedServers: [{ invite: "rjJUPF4Bq5" }, { invite: "redengine" }],
            },

            data: {
                error: false,

                username: null,

                avatar: null,

                banner: {
                    image: null,
                    color: null
                },

                description: null,

                servers: []
            }
        }
    },

    methods: {
        async fetchUrlWithProxy(link) {
            if (typeof link !== 'string') {
                this.info.data.error = true;
                return console.error('Link is not a string.');
            }

            const response = await fetch('https://corsproxy.io/?' + encodeURIComponent(link));

            if (!response['ok']) {
                return;
            }

            return response;
        },

        async getMusicAndPlay() {
            const audio = new Audio('assets/music.mp3');

            try {
                audio['volume'] = 0.1;

                audio['loop'] = true;

                audio['play']();
            } catch (error) {
                this.info.data.error = true;
            }
        },

        async display() {
            console.log('Hello, World!');
            
            try {
                this.getDiscordInfoForOwner();

                this.info.stuff.checking = true;
            } catch (error) {
                console.error(error);

                this.info.data.error = true;
            }
        },

        async displayTab(type) {
            switch (type) {
                case "discord":
                    window['open'](`https://discord.com/users/${this.info.stuff.ownerDiscordId}`);
                    break;
                
                case "github":
                    window['open'](this.info.stuff.github);
                    break;

                default:
                    break;
            }
        },

        async getOwnedServersInfo() {
            try {
                const cache = JSON['parse'](localStorage['getItem']('serverCache')) || {};

                const updatedServers = await Promise['all'](this.info.stuff.ownedServers['map'](async server => {
                    if (!server['invite'] || typeof server['invite'] !== 'string') {
                        this.info.data.error = true;
                        return null;
                    }

                    if (cache[server['invite']]) {
                        return cache[server['invite']];
                    }

                    try {
                        const response = await this.fetchUrlWithProxy(`https://discord.com/api/v10/invites/${server['invite']}?with_counts=true`);

                        if (!response['ok']) {
                            this.info.data.error = true;
                            return null;
                        }

                        const data = await response['json']();

                        cache[server['invite']] = data;

                        localStorage['setItem']('serverCache', JSON['stringify'](cache));

                        return data;
                    } catch (error) {
                        console.error(error);

                        this.info.data.error = true;

                        return null;
                    }
                }));

                return updatedServers;
            } catch (error) {
                return [];
            }
        },

        async joinServer(invite) {
            try {
                window['open'](`https://discord.gg/${invite}`);
            } catch (error) {
                alert('An error occurred while trying to join the server.');
                this.info.data.error = true;
            }
        },

        async getDiscordInfoForOwner() {
            try {
                if (!this.info['stuff']['ownerDiscordId'] || typeof this.info['stuff']['ownerDiscordId'] !== 'string') {
                    throw new Error("Owner ID is not valid.");
                }

                if (this.info.stuff.checking) {
                    return;
                }

                const response = await this.fetchUrlWithProxy(`https://dashboard.botghost.com/api/public/tools/user_lookup/${this.info['stuff']['ownerDiscordId']}`);

                if (!response['ok']) {
                    this.info.data.error = true;
                    return;
                }

                const data = await response['json']();
                const servers = await this.getOwnedServersInfo();

                this.info.data = {
                    username: data['username'],

                    avatar: `https://cdn.discordapp.com/avatars/${data['id']}/${data['avatar']}`,

                    banner: {
                        image: data['banner'] ? `https://cdn.discordapp.com/banners/${data['id']}/${data['banner']}` : null,
                        color: data['banner_color'] || null
                    },

                    description: data['description'],

                    servers: Array['isArray'](servers) ? servers['map'](server => {
                        console.log(server);
                        
                        return {
                            invite: server['code'] || null,
                            icon: `https://cdn.discordapp.com/icons/${server['guild']['id']}/${server['guild']['icon']}`,
                            name: server['guild']['name'],
                            offline: server['approximate_member_count'],
                            online: server['approximate_presence_count']
                        }
                    }) : []
                };

                this.info.stuff.loading = !this.info.stuff.loading;

                setTimeout(() => {
                    this.info.stuff.active = !this.info.stuff.active;

                    this.getMusicAndPlay();
                }, 1000);
            } catch (error) {
                console.error(error);

                this.info.data.error = true;
            }
        }
    }
});