import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { GetIpfsUrlFromPinata } from "./pinata";

function NFTTile (data) {
    const newTo = {
        pathname:"/nftPage/"+data.data.tokenId
    }

    const IPFSUrl = GetIpfsUrlFromPinata(data.data.image);

    return (
        <div style={{ width: '8rem' }}>
            <Link 
                to={newTo} 
                style={{ 
                    textDecoration: 'none',
                    display: 'block'
                }}
            >
                <Card className="h-100 bg-dark text-white">
                    <Card.Img 
                        variant="top" 
                        src={IPFSUrl} 
                        style={{ height: '8rem', objectFit: 'cover' }}
                        crossOrigin="anonymous"
                    />
                    <Card.Body className="p-2">
                        <Card.Title 
                            className="mb-1" 
                            style={{ 
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                marginBottom: '0.25rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {data.data.name}
                        </Card.Title>
                        <Card.Text 
                            style={{ 
                                fontSize: '0.7rem',
                                margin: 0
                            }}
                        >
                            {data.data.price} ETH
                        </Card.Text>
                    </Card.Body>
                </Card>
            </Link>
        </div>
    )
}

export default NFTTile;