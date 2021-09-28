import Conf from "conf";

const config = new Conf();

export const ConnectCli = async () => {
    try {
        console.log('Connect cli');
        console.log(config.get('current'))

    } catch (error) {
        console.log('Something went wrong');
    }
};
