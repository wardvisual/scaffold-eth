import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, List, Spin, Popover, Form, Switch } from "antd";
import { RedoOutlined } from "@ant-design/icons";
import { Address, AddressInput } from "../components";
import { ethers } from "ethers";
import { useEventListener } from "eth-hooks/events/useEventListener";

function OldEnglish({
  readContracts,
  mainnetProvider,
  blockExplorer,
  totalSupply,
  DEBUG,
  writeContracts,
  tx,
  address,
  localProvider,
  oldEnglishContract,
  balance,
}) {
  const [allOldEnglish, setAllOldEnglish] = useState({});
  const [loadingOldEnglish, setLoadingOldEnglish] = useState(true);
  const perPage = 8;
  const [page, setPage] = useState(0);

  const receives = useEventListener(readContracts, oldEnglishContract, "Receive", localProvider, 1);
  //const filtered =
  //  readContracts[oldEnglishContract] &&
  //  readContracts[oldEnglishContract].queryFilter(readContracts[oldEnglishContract].filters.Transfer(null, address));
  //console.log(filtered);

  const fetchMetadataAndUpdate = async id => {
    try {
      const tokenURI = await readContracts[oldEnglishContract].tokenURI(id);
      const jsonManifestString = atob(tokenURI.substring(29));

      try {
        const jsonManifest = JSON.parse(jsonManifestString);
        const collectibleUpdate = {};
        collectibleUpdate[id] = { id: id, uri: tokenURI, ...jsonManifest };

        setAllOldEnglish(i => ({ ...i, ...collectibleUpdate }));
      } catch (e) {
        console.log(e);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const updateAllOldEnglish = async fetchAll => {
    if (readContracts[oldEnglishContract] && totalSupply && totalSupply <= receives.length) {
      setLoadingOldEnglish(true);
      let reversed = [...receives]
        .reverse()
        .filter(function (el) {
          return el.args.tokenId > 0;
        })
        .slice(page, page * perPage + perPage);

      console.log(reversed);
      reversed.forEach(async oe => {
        if (oe.args.tokenId > 0 && (fetchAll || !allOldEnglish[oe.args.tokenId])) {
          fetchMetadataAndUpdate(oe.args.tokenId);
        }
      });
      setLoadingOldEnglish(false);
    }
  };

  const updateYourOldEnglish = async () => {
    for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
      try {
        const tokenId = await readContracts[oldEnglishContract].tokenOfOwnerByIndex(address, tokenIndex);
        fetchMetadataAndUpdate(tokenId);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const updateOneOldEnglish = async id => {
    if (readContracts[oldEnglishContract] && totalSupply) {
      fetchMetadataAndUpdate(id);
    }
  };

  useEffect(() => {
    updateAllOldEnglish(false);
  }, [readContracts[oldEnglishContract], (totalSupply || "0").toString(), receives, page]);

  const onFinishFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  const [form] = Form.useForm();
  const sendForm = id => {
    const [sending, setSending] = useState(false);

    return (
      <div>
        <Form
          form={form}
          layout={"inline"}
          name="sendOE"
          initialValues={{ tokenId: id }}
          onFinish={async values => {
            setSending(true);
            try {
              const txCur = await tx(
                writeContracts[oldEnglishContract]["safeTransferFrom(address,address,uint256)"](
                  address,
                  values["to"],
                  id,
                ),
              );
              await txCur.wait();
              updateOneOldEnglish(id);
              setSending(false);
            } catch (e) {
              console.log("send failed", e);
              setSending(false);
            }
          }}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            name="to"
            rules={[
              {
                required: true,
                message: "Which address should receive this OE?",
              },
            ]}
          >
            <AddressInput ensProvider={mainnetProvider} placeholder={"to address"} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={sending}>
              Send
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };

  const [pourForm] = Form.useForm();
  const pour = id => {
    const [pouring, setPouring] = useState(false);

    return (
      <div>
        <Form
          form={pourForm}
          layout={"inline"}
          name="pourOE"
          initialValues={{ tokenId: id }}
          onFinish={async values => {
            setPouring(true);
            try {
              const txCur = await tx(writeContracts[oldEnglishContract]["pour"](id, values["to"]));
              await txCur.wait();
              updateOneOldEnglish(id);
              setPouring(false);
            } catch (e) {
              console.log("pour failed", e);
              setPouring(false);
            }
          }}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            name="to"
            rules={[
              {
                required: true,
                message: "Who's getting a pour?",
              },
            ]}
          >
            <AddressInput ensProvider={mainnetProvider} placeholder={"to address"} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={pouring}>
              Pour
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };

  let filteredOEs = Object.values(allOldEnglish).sort((a, b) => b.id - a.id);
  const [mine, setMine] = useState(false);
  if (mine == true && address && filteredOEs) {
    console.log(mine, address, filteredOEs);
    filteredOEs = filteredOEs.filter(function (el) {
      return el.owner == address.toLowerCase();
    });
  }

  return (
    <div style={{ width: "auto", margin: "auto", paddingBottom: 25, minHeight: 800 }}>
      {false ? (
        <Spin style={{ marginTop: 100 }} />
      ) : (
        <div>
          <div style={{ marginBottom: 5 }}>
            <Button
              onClick={() => {
                return updateAllOldEnglish(true);
              }}
            >
              Refresh
            </Button>
            <Switch
              disabled={loadingOldEnglish}
              style={{ marginLeft: 5 }}
              value={mine}
              onChange={() => {
                setMine(!mine);
                updateYourOldEnglish();
              }}
              checkedChildren="mine"
              unCheckedChildren="all"
            />
          </div>
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 2,
              lg: 3,
              xl: 4,
              xxl: 4,
            }}
            pagination={{
              total: mine ? filteredOEs.length : totalSupply,
              defaultPageSize: perPage,
              defaultCurrent: page,
              onChange: currentPage => {
                setPage(currentPage - 1);
                console.log(currentPage);
              },
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${mine ? filteredOEs.length : totalSupply} items`,
            }}
            loading={loadingOldEnglish}
            dataSource={filteredOEs}
            renderItem={item => {
              const id = item.id;

              return (
                <List.Item key={id}>
                  <Card
                    title={
                      <div>
                        <span style={{ fontSize: 18, marginRight: 8 }}>{item.name ? item.name : `OE #${id}`}</span>
                        <Button
                          shape="circle"
                          onClick={() => {
                            updateOneOldEnglish(id);
                          }}
                          icon={<RedoOutlined />}
                        />
                      </div>
                    }
                  >
                    <img src={item.image && item.image} alt={"OldEnglish #" + id} width="200" />
                    {item.owner.toLowerCase() == readContracts[oldEnglishContract].address.toLowerCase() ? (
                      <div>{item.description}</div>
                    ) : (
                      <div>
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                      </div>
                    )}
                    {address && item.owner == address.toLowerCase() && (
                      <>
                        {item.attributes[0].value < 13 ? (
                          <>
                            <Button
                              type="primary"
                              onClick={async () => {
                                try {
                                  const txCur = await tx(writeContracts[oldEnglishContract].sip(id));
                                  await txCur.wait();
                                  updateOneOldEnglish(id);
                                } catch (e) {
                                  console.log("sip failed", e);
                                }
                              }}
                            >
                              Sip
                            </Button>
                            <Popover
                              content={() => {
                                return pour(id);
                              }}
                              title="Pour OE"
                            >
                              <Button type="primary">Pour</Button>
                            </Popover>
                          </>
                        ) : (
                          <Button
                            type="primary"
                            onClick={async () => {
                              try {
                                const txCur = await tx(writeContracts[oldEnglishContract].recycle(id));
                                await txCur.wait();
                                updateOneOldEnglish(id);
                              } catch (e) {
                                console.log("recycle failed", e);
                              }
                            }}
                          >
                            Recycle
                          </Button>
                        )}
                        <Button
                          type="primary"
                          onClick={async () => {
                            try {
                              const txCur = await tx(writeContracts[oldEnglishContract].wrap(id));
                              await txCur.wait();
                              updateOneOldEnglish(id);
                            } catch (e) {
                              console.log("wrap failed", e);
                            }
                          }}
                        >
                          Wrap
                        </Button>
                        <Popover
                          content={() => {
                            return sendForm(id);
                          }}
                          title="Pass it:"
                        >
                          <Button type="primary">Pass it!</Button>
                        </Popover>
                      </>
                    )}
                  </Card>
                </List.Item>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

export default OldEnglish;